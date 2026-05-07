'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { uploadDataURLToStorage } from '@/lib/supabase/storage';

const CART_STORAGE_KEY = 'photify_cart_v1';

interface PersistedCart {
  cartItems: CartItem[];
  deliveryMethod: DeliveryMethod;
  shippingCost: number;
  discount: number;
  appliedPromoCode: string;
  promoApplied: boolean;
}

/** Best-effort restore from localStorage. Returns null on SSR or parse errors. */
function loadPersistedCart(): Partial<PersistedCart> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedCart>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export interface CartItemCustomization {
  edgeType?: string;     // 'wrapped' | 'mirrored'
  cornerStyle?: string;  // 'rounded' | 'sharp'
  imageQuality?: number; // 0–100
  shape?: string;        // 'rectangular' | 'circular' | etc.
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  size?: string;
  quantity: number;
  customization?: CartItemCustomization;
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
  // Initial render always uses defaults so SSR markup matches the first
  // client paint. Real persisted state is hydrated below in an effect to
  // avoid hydration mismatches.
  // Seed cart state lazily from localStorage so the very first render
  // already has the persisted values. This avoids a race where a subsequent
  // "persist" effect could observe the initial empty state before the
  // hydration effect has applied the stored data, and accidentally wipe
  // localStorage.
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = loadPersistedCart();
    return Array.isArray(stored?.cartItems) ? stored!.cartItems! : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(() => {
    const stored = loadPersistedCart();
    return stored?.deliveryMethod === 'express' ? 'express' : 'standard';
  });
  const [shippingCost, setShippingCost] = useState<number>(() => {
    const stored = loadPersistedCart();
    return typeof stored?.shippingCost === 'number' ? stored.shippingCost : 4.99;
  });
  const [discount, setDiscount] = useState<number>(() => {
    const stored = loadPersistedCart();
    return typeof stored?.discount === 'number' ? stored.discount : 0;
  });
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>(() => {
    const stored = loadPersistedCart();
    return typeof stored?.appliedPromoCode === 'string' ? stored.appliedPromoCode : '';
  });
  const [promoApplied, setPromoApplied] = useState<boolean>(() => {
    const stored = loadPersistedCart();
    return typeof stored?.promoApplied === 'boolean' ? stored.promoApplied : false;
  });

  // Persist on every meaningful change. Safe to run immediately because
  // the initial state above already reflects what's in localStorage, so
  // writing it back on first mount is a no-op.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: PersistedCart = {
        cartItems,
        deliveryMethod,
        shippingCost,
        discount,
        appliedPromoCode,
        promoApplied,
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Quota exceeded or storage disabled — ignore; cart still works
      // in-memory for this session.
    }
  }, [
    cartItems,
    deliveryMethod,
    shippingCost,
    discount,
    appliedPromoCode,
    promoApplied,
  ]);

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

    // Auto-upload any additional images (e.g. multi-canvas products)
    let resolvedImages: string[] | undefined;
    if (item.images && item.images.length > 0) {
      resolvedImages = await Promise.all(
        item.images.map(async (img) => {
          if (img && (img.startsWith('data:') || img.startsWith('blob:'))) {
            try {
              const uploaded = await uploadDataURLToStorage(img, 'cart-images');
              return uploaded ?? img;
            } catch {
              return img;
            }
          }
          return img;
        })
      );
    }

    const resolvedItem = {
      ...item,
      image: imageUrl,
      ...(resolvedImages ? { images: resolvedImages } : {}),
    };

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

