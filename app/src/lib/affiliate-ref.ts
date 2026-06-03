/**
 * Affiliate referral cookie.
 *
 * When a visitor lands on `/r/:code` (or manually applies an affiliate's code),
 * we store the referral code in a first-party cookie with a 30-day expiry. A
 * cookie (rather than localStorage) means the attribution survives across the
 * whole session reliably, is sent automatically on same-site navigations, and
 * can be read on any page. Cart + checkout read this to silently apply the
 * affiliate's promo code and to send `affiliateCode` in the payment-intent
 * body so the resulting order is stamped with the correct attribution.
 */

const COOKIE_NAME = 'photify_ref';
const LEGACY_STORAGE_KEY = 'photify_ref_v1';
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function setAffiliateRef(code: string): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeCode(code);
  if (!normalized) return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(normalized)}; Max-Age=${TTL_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export function getAffiliateRef(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (cookie) {
    const raw = cookie.slice(COOKIE_NAME.length + 1);
    const value = normalizeCode(decodeURIComponent(raw));
    return value || null;
  }

  // Legacy fallback: migrate any existing localStorage-backed ref (set by an
  // earlier version of the app) into a cookie so we don't drop attribution.
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { code?: string; expiresAt?: number };
      if (parsed?.code && (!parsed.expiresAt || Date.now() <= parsed.expiresAt)) {
        const value = normalizeCode(parsed.code);
        if (value) {
          setAffiliateRef(value);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          return value;
        }
      }
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    /* storage disabled or unparseable — no legacy ref to migrate */
  }

  return null;
}

export function clearAffiliateRef(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
