import { applyDiscount, roundGbp } from '../apply-discount';
import type {
  PromoLineItem,
  PromoScope,
  ProductPromoContext,
  ResolvedPromo,
} from './types';
import { SITEWIDE_SCOPE } from './types';

export function normalizeScope(
  categories?: string[] | null,
  excludedProductIds?: string[] | null
): PromoScope {
  const cats =
    Array.isArray(categories) && categories.length > 0 ? categories : ['all'];
  return {
    categories: cats.map(c => String(c).toLowerCase()),
    excludedProductIds: (excludedProductIds ?? []).map(id => String(id)),
  };
}

export function isSitewideScope(scope: PromoScope): boolean {
  return scope.categories.includes('all');
}

/** Whether a product is eligible for a scoped promo (sitewide path implemented now). */
export function isProductInScope(
  productId: string | undefined,
  productCategories: string[] | undefined,
  scope: PromoScope
): boolean {
  if (isSitewideScope(scope)) {
    if (!productId) return true;
    return !scope.excludedProductIds.includes(productId);
  }

  if (!productId && (!productCategories || productCategories.length === 0)) {
    return false;
  }

  if (productId && scope.excludedProductIds.includes(productId)) {
    return false;
  }

  const itemCats = (productCategories ?? []).map(c => c.toLowerCase());
  return scope.categories.some(cat => itemCats.includes(cat.toLowerCase()));
}

/** Applicable percent for a product (0 when out of scope). */
export function getDiscountPercentForProduct(
  resolved: ResolvedPromo,
  context?: ProductPromoContext
): number {
  if (!resolved.winningCode || resolved.discountPercent <= 0) return 0;

  if (!context?.productId && !context?.categories?.length) {
    return isSitewideScope(resolved.scope) ? resolved.discountPercent : 0;
  }

  return isProductInScope(context.productId, context.categories, resolved.scope)
    ? resolved.discountPercent
    : 0;
}

/** Sum of per-line savings for cart/checkout display. */
export function savingsForItems(
  resolved: ResolvedPromo,
  items: PromoLineItem[]
): number {
  if (!resolved.winningCode || resolved.discountPercent <= 0) return 0;

  let total = 0;
  for (const item of items) {
    const percent = getDiscountPercentForProduct(resolved, {
      productId: item.id,
      categories: item.categories,
    });
    if (percent <= 0) continue;
    const lineTotal = item.price * item.quantity;
    const discounted = applyDiscount(lineTotal, percent);
    total += lineTotal - discounted;
  }
  return roundGbp(total);
}

/** Sitewide convenience: subtotal * percent. */
export function savingsForSubtotal(
  resolved: ResolvedPromo,
  subtotal: number
): number {
  if (!resolved.winningCode || resolved.discountPercent <= 0 || subtotal <= 0) {
    return 0;
  }
  if (!isSitewideScope(resolved.scope)) {
    return 0;
  }
  const discounted = applyDiscount(subtotal, resolved.discountPercent);
  return roundGbp(subtotal - discounted);
}
