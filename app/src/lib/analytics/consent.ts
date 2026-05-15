/**
 * Consent storage + Google Consent Mode v2 integration.
 *
 * The site loads gtag with all storage defaulted to `denied` (see
 * `root.tsx`). When the user accepts via the cookie banner we call
 * `setConsent('accepted')` which pushes `gtag('consent', 'update', ...)`
 * to flip analytics_storage + ad_storage to `granted`. PostHog reads
 * the same state via `getConsent()` and opts in/out accordingly.
 */

export const CONSENT_STORAGE_KEY = 'photify_cookie_consent';

export type ConsentValue = 'accepted' | 'denied';

const CONSENT_CHANGED_EVENT = 'photify:consent-changed';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Read the persisted consent choice. Returns `null` when the user
 * hasn't decided yet (banner should still be shown). */
export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'accepted' || stored === 'denied') return stored;
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist the user's choice, push it into Google Consent Mode, and
 * broadcast a window event so other parts of the app (PostHog init,
 * cookie banner) can react.
 *
 * Safe to call from non-live hostnames — the gtag/PostHog wrappers each
 * check `isLiveSite()` independently, so this is a no-op in dev for the
 * vendors but the localStorage state still updates so the UI doesn't
 * re-prompt.
 */
export function setConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage disabled / quota — choice won't persist across reloads
    // but the runtime consent state below still takes effect.
  }

  const granted = value === 'accepted' ? 'granted' : 'denied';
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted,
      analytics_storage: granted,
    });
  }

  window.dispatchEvent(
    new CustomEvent<ConsentValue>(CONSENT_CHANGED_EVENT, { detail: value })
  );
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(
  handler: (value: ConsentValue) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<ConsentValue>).detail;
    if (detail === 'accepted' || detail === 'denied') handler(detail);
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, listener);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
}

/** Reopens the cookie banner so the user can change their choice. */
export const REOPEN_BANNER_EVENT = 'photify:reopen-cookie-banner';
export function reopenCookieBanner(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REOPEN_BANNER_EVENT));
}
