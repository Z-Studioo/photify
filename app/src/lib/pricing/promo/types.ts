export type PromoSource = 'manual' | 'affiliate' | 'auto_apply';

/** Which products/categories a promo applies to. Sitewide = categories includes 'all'. */
export interface PromoScope {
  categories: string[];
  excludedProductIds: string[];
}

export interface PromoCandidate {
  code: string;
  percent: number;
  source: PromoSource;
  scope: PromoScope;
}

export interface ResolvedPromo {
  winningCode: string | null;
  discountPercent: number;
  source: PromoSource | null;
  scope: PromoScope;
}

export interface PromoSession {
  code: string;
  percent: number;
  source: PromoSource;
  scope: PromoScope;
  expiresAt: number;
}

export interface PromoLineItem {
  id: string;
  price: number;
  quantity: number;
  categories?: string[];
}

export interface ProductPromoContext {
  productId?: string;
  categories?: string[];
}

export const SITEWIDE_SCOPE: PromoScope = {
  categories: ['all'],
  excludedProductIds: [],
};

export const EMPTY_RESOLVED_PROMO: ResolvedPromo = {
  winningCode: null,
  discountPercent: 0,
  source: null,
  scope: SITEWIDE_SCOPE,
};
