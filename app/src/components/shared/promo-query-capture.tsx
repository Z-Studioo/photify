import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useCart } from '@/context/CartContext';
import { PROMO_QUERY_KEY } from '@/lib/promo-landing-ref';

/**
 * Applies `?promo=CODE` from any URL (e.g. `/product/single-canvas?promo=SAVE`)
 * into the same first-party cookie + CartContext state as `/p/:code`.
 *
 * After applying, strips the query param with `replace` so the visible URL
 * stays the canonical product path. Mounted once in `root.tsx`.
 */
export function PromoQueryCapture() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setPromoLandingRef } = useCart();
  const setPromoLandingRefRef = useRef(setPromoLandingRef);
  setPromoLandingRefRef.current = setPromoLandingRef;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(location.search);
    const code = (params.get(PROMO_QUERY_KEY) || '').trim().toUpperCase();
    if (!code) return;

    setPromoLandingRefRef.current(code);

    params.delete(PROMO_QUERY_KEY);
    const next = params.toString();
    const path =
      location.pathname + (next ? `?${next}` : '') + location.hash;
    navigate(path, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
