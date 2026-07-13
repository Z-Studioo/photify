import type { DiscountedPrice } from './types';

/** Round to 2 decimal places for GBP display/charge consistency. */
export function roundGbp(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Apply a percentage discount to a single amount. */
export function applyDiscount(amount: number, percent: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return roundGbp(amount);
  const discounted = amount * (1 - percent / 100);
  return roundGbp(Math.max(0, discounted));
}

/** Build original / discounted / badge fields for a list price. */
export function computeDiscountedPrice(
  amount: number,
  percent: number
): DiscountedPrice {
  const original = roundGbp(amount);
  const discounted = applyDiscount(original, percent);
  const hasDiscount = percent > 0 && discounted < original;
  return {
    original,
    discounted,
    percentOff: hasDiscount ? Math.round(percent) : 0,
    hasDiscount,
  };
}
