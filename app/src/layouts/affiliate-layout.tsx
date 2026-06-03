import { Outlet } from 'react-router';
import { buildMeta } from '@/lib/seo';
import { ClientOnly } from '@/components/shared/client-only';
import type { Route } from './+types/affiliate-layout';

/**
 * Affiliate area layout. `noindex,nofollow` like the admin layout, and
 * rendered client-only so the Supabase-auth-gated dashboard doesn't try to
 * fetch sensitive data during SSR.
 */
export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Affiliate Dashboard | Photify',
    description: 'Photify affiliate dashboard.',
    path: '/affiliate',
    noindex: true,
  });

export default function AffiliateLayoutRoute() {
  return (
    <ClientOnly>
      <Outlet />
    </ClientOnly>
  );
}
