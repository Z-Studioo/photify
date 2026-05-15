import { Outlet } from 'react-router';
import { buildMeta } from '@/lib/seo';
import { ClientOnly } from '@/components/shared/client-only';
import type { Route } from './+types/admin-layout';

/**
 * Admin area layout. Injects a `noindex,nofollow` robots meta for every
 * admin route and renders the entire admin subtree client-only so
 * dashboards / editors with heavy browser-only deps don't run during SSR.
 */
export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Admin | Photify',
    description: 'Photify admin dashboard.',
    path: '/admin',
    noindex: true,
  });

export default function AdminLayout() {
  return (
    <ClientOnly>
      <Outlet />
    </ClientOnly>
  );
}
