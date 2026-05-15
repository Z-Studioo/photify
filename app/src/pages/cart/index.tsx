import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const CartPage = lazy(() =>
  import('@/components/pages/cart').then(m => ({ default: m.CartPage }))
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Your Cart | Photify',
    description: 'Review the items in your Photify cart before checkout.',
    path: '/cart',
    noindex: true,
  });

export default function Cart() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <CartPage />
      </Suspense>
    </ClientOnly>
  );
}
