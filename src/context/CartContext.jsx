import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorites')) || []; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);

  const addToCart = (product, qty = 1) => {
    setCart(c => {
      const ex = c.find(x => x.product === product._id);
      if (ex) return c.map(x => x.product === product._id ? { ...x, qty: x.qty + qty } : x);
      return [...c, { product: product._id, name: product.name, price: product.price, image: product.images?.[0], qty }];
    });
  };
  const updateQty = (productId, qty) => {
    if (qty <= 0) return setCart(c => c.filter(x => x.product !== productId));
    setCart(c => c.map(x => x.product === productId ? { ...x, qty } : x));
  };
  const removeFromCart = (productId) => setCart(c => c.filter(x => x.product !== productId));
  const clearCart = () => setCart([]);
  const initFavorites = (ids) => setFavorites(prev => {
    const merged = [...new Set([...prev, ...ids])];
    return merged;
  });

  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const next = prev.includes(productId) ? prev.filter(x => x !== productId) : [...prev, productId];
      api.patch('/auth/favorites', { ids: next }).catch(() => {});
      return next;
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, favorites, addToCart, updateQty, removeFromCart, clearCart, toggleFavorite, initFavorites, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
