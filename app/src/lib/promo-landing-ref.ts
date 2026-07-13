/**
 * Promo landing cookie (non-affiliate).
 *
 * When a visitor lands on `/p/:code`, we store the promo code in a first-party
 * cookie with a 30-day expiry. Cart + PromoDiscountContext read this to apply
 * the matching promotions row sitewide — same cookie pattern as affiliate
 * `/r/:code`, but without affiliate attribution or commission.
 */

const COOKIE_NAME = 'photify_promo_land';
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function setPromoLandingRef(code: string): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeCode(code);
  if (!normalized) return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(normalized)}; Max-Age=${TTL_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export function getPromoLandingRef(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  const raw = cookie.slice(COOKIE_NAME.length + 1);
  const value = normalizeCode(decodeURIComponent(raw));
  return value || null;
}

export function clearPromoLandingRef(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Public landing path for a promo code (e.g. `/p/SAVE10`). */
export function promoLandingPath(code: string): string {
  const normalized = normalizeCode(code);
  return normalized ? `/p/${encodeURIComponent(normalized)}` : '/p/';
}
