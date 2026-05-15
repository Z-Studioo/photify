import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const CheckoutPage = lazy(() =>
  import('@/components/pages/checkout').then(m => ({ default: m.CheckoutPage }))
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Checkout | Photify',
    description: 'Complete your Photify order securely.',
    path: '/checkout',
    noindex: true,
  });

export default function Checkout() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <CheckoutPage />
      </Suspense>
    </ClientOnly>
  );
}
