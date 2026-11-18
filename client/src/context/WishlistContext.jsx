import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await wishlistService.getWishlist();
      setWishlistItems(data.coins || data.items || []);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
      setWishlistItems([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlist(true);
    } else {
      setWishlistItems([]);
    }
  }, [user, fetchWishlist]);

  const isInWishlist = useCallback(
    (coinId) => {
      if (!coinId) return false;
      return wishlistItems.some((item) => {
        const id = item?._id || item?.coin?._id || item;
        return id?.toString() === coinId?.toString();
      });
    },
    [wishlistItems]
  );

  const toggleWishlist = async (coinId, coinData = null) => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return;
    }

    const previousItems = wishlistItems;
    const exists = isInWishlist(coinId);

    // Optimistic toggle
    if (exists) {
      setWishlistItems((prev) =>
        prev.filter((item) => {
          const id = item?._id || item?.coin?._id || item;
          return id?.toString() !== coinId?.toString();
        })
      );
    } else {
      const newItem = coinData || { _id: coinId };
      setWishlistItems((prev) => [newItem, ...prev]);
    }

    try {
      const data = await wishlistService.toggleWishlist(coinId);
      if (data?.coins || data?.items) {
        setWishlistItems(data.coins || data.items);
      }
      toast.success(exists ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (error) {
      // Rollback on error
      setWishlistItems(previousItems);
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
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
