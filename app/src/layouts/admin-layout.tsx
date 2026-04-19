import { Outlet } from 'react-router';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/admin-layout';

/**
 * Admin area layout. The only purpose here (for now) is to inject a
 * `noindex,nofollow` robots meta for every admin route without having to
 * duplicate a `meta()` export in every child page.
 */
export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Admin | Photify',
    description: 'Photify admin dashboard.',
    path: '/admin',
    noindex: true,
  });

export default function AdminLayout() {
  return <Outlet />;
}
