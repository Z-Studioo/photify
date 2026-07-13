/**
 * Promo landing cookie (non-affiliate).
 *
 * Visitors can land via:
 * - `/p/:code` (dedicated landing → cookie → redirect home)
 * - any page with `?promo=CODE` (e.g. `/product/single-canvas?promo=SAVE`)
 *
 * We store the promo code in a first-party cookie with a 30-day expiry.
 * Cart + PromoDiscountContext read this to apply the matching promotions row
 * sitewide — same cookie pattern as affiliate `/r/:code`, but without
 * affiliate attribution or commission.
 */

const COOKIE_NAME = 'photify_promo_land';
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

/** Query key for product (and other) share URLs: `?promo=SAVE`. */
export const PROMO_QUERY_KEY = 'promo';

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

/**
 * Append `?promo=CODE` to a path (e.g. `/product/single-canvas?promo=SAVE`).
 * Preserves any existing query string.
 */
export function withPromoQuery(path: string, code: string): string {
  const normalized = normalizeCode(code);
  if (!normalized) return path;

  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const qIndex = withoutHash.indexOf('?');
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const search = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : '';
  const params = new URLSearchParams(search);
  params.set(PROMO_QUERY_KEY, normalized);
  const next = params.toString();
  return `${pathname}?${next}${hash}`;
}
