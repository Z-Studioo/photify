/**
 * Live-site gate. Analytics MUST only fire when the page is being served
 * from production photify.co — not from localhost, Render preview URLs
 * (*.onrender.com), or staging. Keep this list narrow on purpose: every
 * extra hostname here pollutes GA4 / PostHog with non-customer traffic.
 */

const LIVE_HOSTNAMES = ['photify.co', 'www.photify.co'] as const;

/**
 * Returns true only when the current page is being viewed on a live
 * Photify production hostname. SSR-safe (returns false on the server so
 * code paths that depend on `window` short-circuit cleanly).
 */
export function isLiveSite(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname ?? '';
  return (LIVE_HOSTNAMES as readonly string[]).includes(host);
}

/**
 * Returns true for `/admin/*` routes. Used to suppress page_view and
 * other tracking on internal traffic, and to drive the GA4 "Internal
 * traffic" data filter via the `traffic_type=internal` parameter.
 */
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}
