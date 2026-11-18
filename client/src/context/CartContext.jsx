import { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await cartService.getCart();
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCart(true);
    } else {
      setCartItems([]);
    }
  }, [user, fetchCart]);

  const addToCart = async (coinId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      const data = await cartService.addToCart(coinId, quantity);
      if (data?.items) {
        setCartItems(data.items);
      }
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateQuantity = async (coinId, quantity) => {
    const previousItems = cartItems;
    // Optimistic update
    setCartItems((prev) =>
      prev.map((item) => {
        const id = item.coin?._id || item.coin;
        return id === coinId ? { ...item, quantity } : item;
      })
    );

    try {
      const data = await cartService.updateCartItem(coinId, quantity);
      if (data?.items) {
        setCartItems(data.items);
      }
    } catch (error) {
      // Rollback on failure
      setCartItems(previousItems);
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (coinId) => {
    const previousItems = cartItems;
    // Optimistic remove
    setCartItems((prev) =>
      prev.filter((item) => {
        const id = item.coin?._id || item.coin;
        return id !== coinId;
      })
    );

    try {
      const data = await cartService.removeFromCart(coinId);
      if (data?.items) {
        setCartItems(data.items);
      }
      toast.success('Removed from cart');
    } catch (error) {
      // Rollback on failure
      setCartItems(previousItems);
      toast.error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    const previousItems = cartItems;
    setCartItems([]);
    try {
      await cartService.clearCart();
    } catch (error) {
      setCartItems(previousItems);
      toast.error('Failed to clear cart');
    }
  };

  const isInCart = useCallback(
    (coinId) => {
      return cartItems.some((item) => {
        const id = item.coin?._id || item.coin;
        return id === coinId;
      });
    },
    [cartItems]
  );

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cartItems]);

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    isInCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
