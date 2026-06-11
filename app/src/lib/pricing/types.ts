export interface DiscountedPrice {
  original: number;
  discounted: number;
  percentOff: number;
  hasDiscount: boolean;
}

export interface PromoCandidate {
  code: string;
  percent: number;
  source: 'manual' | 'affiliate' | 'auto_apply';
}

export interface ResolvedPromo {
  winningCode: string | null;
  discountPercent: number;
  source: PromoCandidate['source'] | null;
}
