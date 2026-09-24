import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.success) setCart(res.data.cart || res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    const res = await cartService.addItem(productId, quantity);
    if (res.success) await fetchCart();
    return res;
  };

  const updateItem = async (itemId, quantity) => {
    const res = await cartService.updateItem(itemId, quantity);
    if (res.success) await fetchCart();
    return res;
  };

  const removeItem = async (itemId) => {
    const res = await cartService.removeItem(itemId);
    if (res.success) await fetchCart();
    return res;
  };

  const clearCart = async () => {
    const res = await cartService.clearCart();
    if (res.success) setCart(null);
    return res;
  };

  const itemCount = cart?.items?.length || 0;
  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addItem, updateItem, removeItem, clearCart, itemCount, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
