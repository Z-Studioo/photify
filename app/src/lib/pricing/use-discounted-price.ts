import { useMemo } from 'react';
import { usePromoDiscount } from '@/context/PromoDiscountContext';
import { computeDiscountedPrice } from './apply-discount';
import type { DiscountedPrice } from './types';

/** Derive crossed / discounted amounts for a single list price. */
export function useDiscountedPrice(amount: number | null | undefined): DiscountedPrice {
  const { discountPercent } = usePromoDiscount();

  return useMemo(() => {
    const base = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    return computeDiscountedPrice(base, discountPercent);
  }, [amount, discountPercent]);
}
