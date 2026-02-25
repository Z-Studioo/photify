'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { uploadDataURLToStorage } from '@/lib/supabase/storage';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  quantity: number;
}

export type DeliveryMethod = 'standard' | 'express';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  shippingCost: number;
  setShippingCost: (cost: number) => void;
  // Promo / discount
  discount: number;
  setDiscount: (amount: number) => void;
  appliedPromoCode: string;
  setAppliedPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
  clearPromo: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [shippingCost, setShippingCost] = useState(9.99);
  const [discount, setDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const clearPromo = () => {
    setDiscount(0);
    setAppliedPromoCode('');
    setPromoApplied(false);
  };

  const addToCart = async (item: CartItem): Promise<void> => {
    let imageUrl = item.image;

    // Auto-upload data: or blob: URLs to Supabase so track-order shows the image
    if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) {
      try {
        const uploaded = await uploadDataURLToStorage(imageUrl, 'cart-images');
        if (uploaded) {
          imageUrl = uploaded;
        }
      } catch {
        // Keep original URL if upload fails - image just won't show in track-order
      }
    }

    const resolvedItem = { ...item, image: imageUrl };

    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === resolvedItem.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === resolvedItem.id ? { ...i, quantity: i.quantity + resolvedItem.quantity } : i
        );
      }
      return [...prev, resolvedItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        deliveryMethod,
        setDeliveryMethod,
        shippingCost,
        setShippingCost,
        discount,
        setDiscount,
        appliedPromoCode,
        setAppliedPromoCode,
        promoApplied,
        setPromoApplied,
        clearPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

