'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/products-data';

export interface CartItem {
  product: Product;
  qty: number;
  voltage: string;
  option?: string;
}

interface CartContextType {
  cart: Record<string, CartItem>;
  wishlist: string[];
  addToCart: (product: Product, qty?: number, voltage?: string, option?: string) => void;
  updateQty: (slug: string, delta: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('sumaq_cart_next');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedWishlist = localStorage.getItem('sumaq_wishlist_next');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch {
      // Ignore storage errors
    }
    setMounted(true);
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('sumaq_cart_next', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('sumaq_wishlist_next', JSON.stringify(wishlist));
    } catch {
      // Ignore
    }
  }, [wishlist, mounted]);

  const addToCart = (product: Product, qty = 1, voltage = '220V', option = '') => {
    setCart((prev) => {
      const existing = prev[product.slug];
      const newQty = existing ? existing.qty + qty : qty;
      return {
        ...prev,
        [product.slug]: {
          product,
          qty: newQty,
          voltage: voltage || existing?.voltage || '220V',
          option: option || existing?.option || '',
        },
      };
    });
  };

  const updateQty = (slug: string, delta: number) => {
    setCart((prev) => {
      const item = prev[slug];
      if (!item) return prev;
      const nextQty = item.qty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      }
      return {
        ...prev,
        [slug]: { ...item, qty: nextQty },
      };
    });
  };

  const removeFromCart = (slug: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[slug];
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const toggleWishlist = (slug: string) => {
    setWishlist((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  const isWishlisted = (slug: string) => wishlist.includes(slug);

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const subtotal = Object.values(cart).reduce(
    (sum, item) => sum + item.product.prices.reg * item.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isWishlisted,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
