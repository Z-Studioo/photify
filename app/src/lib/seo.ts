import { useLocation } from 'react-router-dom';

/**
 * Build a canonical absolute URL for the current route. Uses
 * `VITE_APP_URL` as the origin, falling back to `window.location.origin`
 * on the client. Works in both SSR (via react-router's StaticRouter
 * location context) and on the client.
 */
export function useCanonicalUrl(): string {
  const location = useLocation();
  const origin =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env?.[
        'VITE_APP_URL'
      ]) ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    '';
  const pathname = location.pathname === '/' ? '' : location.pathname;
  return `${origin}${pathname}`;
}
