import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { track } from '@/lib/analytics';
import { isAdminPath } from '@/lib/analytics/env';

/**
 * Fires a GA4 / PostHog `page_view` event on every React Router
 * navigation. Mounted once in `root.tsx`.
 *
 * Admin routes are excluded so internal users don't pollute marketing
 * analytics. We additionally set `traffic_type=internal` on those page
 * views so they're caught by the GA4 "Internal Traffic" data filter
 * even if the operator forgets to enable an IP allowlist.
 */
export function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = location.pathname;

    // Tag admin sessions so GA4's data filter can drop them. This still
    // emits a page_view (useful for the admin team's own debugging), but
    // GA4 will exclude it from public-facing reports.
    if (isAdminPath(pathname)) {
      try {
        window.gtag?.('set', { traffic_type: 'internal' });
      } catch {
        /* swallow */
      }
      return;
    }

    const page_path = pathname + location.search;
    track({
      name: 'page_view',
      params: {
        page_path,
        page_title: typeof document !== 'undefined' ? document.title : undefined,
        page_location:
          typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });
  }, [location.pathname, location.search]);

  return null;
}
