export {
  getPromoSession,
  setPromoSession,
  clearPromoSession,
} from './promo-session';
export { pickHighestPromo } from './resolve-promo-candidates';
export {
  getDiscountPercentForProduct,
  isProductInScope,
  isSitewideScope,
  normalizeScope,
  savingsForItems,
  savingsForSubtotal,
} from './scope';
export type {
  ProductPromoContext,
  PromoCandidate,
  PromoLineItem,
  PromoScope,
  PromoSession,
  PromoSource,
  ResolvedPromo,
} from './types';
export {
  EMPTY_RESOLVED_PROMO,
  SITEWIDE_SCOPE,
} from './types';
