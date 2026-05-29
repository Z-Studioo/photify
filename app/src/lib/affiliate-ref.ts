/**
 * Affiliate referral cookie (localStorage-backed).
 *
 * When a visitor lands on `/r/:code`, we store an `AffiliateRef` payload with
 * a 30-day expiry. Cart + checkout read this to silently apply the affiliate's
 * promo code and to send `affiliateCode` in the payment-intent body so the
 * resulting order is stamped with the correct attribution.
 */

const STORAGE_KEY = 'photify_ref_v1';
const TTL_DAYS = 30;

export interface AffiliateRef {
  code: string;
  expiresAt: number;
}

export function setAffiliateRef(code: string): void {
  if (typeof window === 'undefined') return;
  const payload: AffiliateRef = {
    code: code.toUpperCase(),
    expiresAt: Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage disabled — affiliate attribution silently disabled */
  }
}

export function getAffiliateRef(): AffiliateRef | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AffiliateRef;
    if (!parsed?.code || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAffiliateRef(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
