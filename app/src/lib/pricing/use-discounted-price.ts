import { useMemo } from 'react';
import { usePromoDiscount } from '@/context/PromoDiscountContext';
import { computeDiscountedPrice } from './apply-discount';
import type { ProductPromoContext } from './promo';
import type { DiscountedPrice } from './types';

/** Derive crossed / discounted amounts for a single list price. */
export function useDiscountedPrice(
  amount: number | null | undefined,
  productContext?: ProductPromoContext
): DiscountedPrice {
  const { discountPercent, getDiscountForProduct } = usePromoDiscount();

  const productId = productContext?.productId;
  const categories = productContext?.categories;
  const categoryKey = categories?.join('|') ?? '';

  return useMemo(() => {
    const base = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
    const percent =
      productId || categoryKey
        ? getDiscountForProduct({ productId, categories })
        : discountPercent;
    return computeDiscountedPrice(base, percent);
  }, [amount, discountPercent, productId, categoryKey, categories, getDiscountForProduct]);
}
