export interface DiscountedPrice {
  original: number;
  discounted: number;
  percentOff: number;
  hasDiscount: boolean;
}

export type {
  PromoCandidate,
  PromoScope,
  PromoSource,
  ResolvedPromo,
} from './promo/types';
