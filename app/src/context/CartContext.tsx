import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { uploadDataURLToStorage } from '@/lib/supabase/storage';
import { track, cleanProductName, type AnalyticsItem } from '@/lib/analytics';
import { getAffiliateRef, setAffiliateRef as persistAffiliateRef } from '@/lib/affiliate-ref';
import { createClient } from '@/lib/supabase/client';

/** Map a CartItem to GA4's Item shape for ecommerce events. */
function toAnalyticsItem(item: CartItem): AnalyticsItem {
  return {
    item_id: item.id,
    item_name: cleanProductName(item.name),
    item_variant: item.size,
    price: item.price,
    quantity: item.quantity,
  };
}

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
  /**
   * Affiliate referral code (uppercase) currently attributed to this
   * browser session via the /r/:code landing flow. Sent through to the
   * payment-intent endpoint so the resulting order is stamped with the
   * correct affiliate. Resets to null when the 30-day cookie expires.
   */
  affiliateRef: string | null;
  /**
   * Persist an affiliate referral code to the cookie and update live state.
   * Used by the /r/:code landing page so attribution applies immediately,
   * even on same-session SPA navigations (no full reload required).
   */
  setAffiliateRef: (code: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // SSR-safe initial state: server and first client render both produce the
  // same defaults so React hydration succeeds without mismatches. The real
  // persisted values are loaded in a post-mount effect (see `hydrated`).
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [shippingCost, setShippingCost] = useState<number>(4.99);
  const [discount, setDiscount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  // Tracks whether we've already pulled from localStorage on the client. We
  // use it to gate the persist effect so the first run doesn't immediately
  // overwrite stored data with our default state.
  const [hydrated, setHydrated] = useState(false);
  const [affiliateRef, setAffiliateRefState] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadPersistedCart();
    if (stored) {
      if (Array.isArray(stored.cartItems)) setCartItems(stored.cartItems);
      if (stored.deliveryMethod === 'express') setDeliveryMethod('express');
      if (typeof stored.shippingCost === 'number') setShippingCost(stored.shippingCost);
      if (typeof stored.discount === 'number') setDiscount(stored.discount);
      if (typeof stored.appliedPromoCode === 'string')
        setAppliedPromoCode(stored.appliedPromoCode);
      if (typeof stored.promoApplied === 'boolean') setPromoApplied(stored.promoApplied);
    }
    setAffiliateRefState(getAffiliateRef());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
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
    hydrated,
    cartItems,
    deliveryMethod,
    shippingCost,
    discount,
    appliedPromoCode,
    promoApplied,
  ]);

  const setAffiliateRef = (code: string) => {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return;
    persistAffiliateRef(normalized);
    setAffiliateRefState(normalized);
  };

  // Auto-apply the affiliate's discount as soon as the visitor is attributed
  // to an affiliate (via /r/:code or a manually-entered affiliate code) and
  // there is something in the cart. Lives in the provider — rather than only
  // on the cart page — so the discount is applied no matter where the user
  // adds their first item, keeping attribution fair to the affiliate. Uses the
  // existing `is_promotion_valid` RPC so it honours the same rules (min order,
  // date window, usage caps) as manually-entered codes.
  useEffect(() => {
    if (!hydrated || !affiliateRef || promoApplied) return;
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (cartItems.length === 0 || subtotal <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('is_promotion_valid', {
          promotion_code: affiliateRef,
          order_total: subtotal,
        });
        if (cancelled || error) return;
        if (data && data.length > 0 && data[0].valid) {
          setPromoApplied(true);
          setDiscount(data[0].discount_amount);
          setAppliedPromoCode(affiliateRef);
        }
      } catch {
        /* swallow — affiliate auto-apply is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, affiliateRef, promoApplied, cartItems]);

  // Keep the discount in sync with the cart total. The discount is stored as a
  // fixed amount computed at apply-time, so without this it would stay frozen
  // at the subtotal it was first calculated for (e.g. only discounting the
  // first item after a second is added). Re-run `is_promotion_valid` against
  // the current subtotal whenever the cart changes while a code is applied. If
  // the code is no longer valid at the new subtotal (e.g. dropped below the
  // minimum order), drop it so the cart matches what checkout would enforce.
  useEffect(() => {
    if (!hydrated || !promoApplied || !appliedPromoCode) return;
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('is_promotion_valid', {
          promotion_code: appliedPromoCode,
          order_total: subtotal,
        });
        if (cancelled || error) return;
        if (data && data.length > 0 && data[0].valid) {
          setDiscount(data[0].discount_amount);
        } else {
          setPromoApplied(false);
          setDiscount(0);
          setAppliedPromoCode('');
        }
      } catch {
        /* best-effort — leave the last known discount in place on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, promoApplied, appliedPromoCode, cartItems]);

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

    // GA4 add_to_cart — fire on every add (even merges into existing
    // line) since the user's intent is "add this many more".
    try {
      const analyticsItem = toAnalyticsItem(resolvedItem);
      track({
        name: 'add_to_cart',
        params: {
          currency: 'GBP',
          value: (resolvedItem.price ?? 0) * (resolvedItem.quantity ?? 1),
          items: [analyticsItem],
        },
      });
    } catch {
      /* analytics must never break the cart */
    }
  };

  const removeFromCart = (id: string) => {
    const removed = cartItems.find((item) => item.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (removed) {
      try {
        const analyticsItem = toAnalyticsItem(removed);
        track({
          name: 'remove_from_cart',
          params: {
            currency: 'GBP',
            value: (removed.price ?? 0) * (removed.quantity ?? 1),
            items: [analyticsItem],
          },
        });
      } catch {
        /* swallow */
      }
    }
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
        affiliateRef,
        setAffiliateRef,
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

