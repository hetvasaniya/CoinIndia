import { createContext, useState, useEffect, useContext } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlistItems(data.coins || data.items || []);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (coinId) => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return;
    }
    try {
      await wishlistService.toggleWishlist(coinId);
      fetchWishlist();
      toast.success('Wishlist updated');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (coinId) => {
    if (!coinId) return false;
    return wishlistItems.some((item) => {
      const id = item?._id || item?.coin?._id || item;
      return id?.toString() === coinId?.toString();
    });
  };

  const value = {
    wishlist: wishlistItems,      // alias used by Wishlist.jsx
    wishlistItems,                // kept for backward compatibility
    loading,
    toggleWishlist,
    isInWishlist,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
