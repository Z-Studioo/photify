import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const ConfirmationPage = lazy(() =>
  import('@/components/pages/confirmation').then(m => ({
    default: m.ConfirmationPage,
  }))
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Order Confirmation | Photify',
    description: 'Your Photify order has been received.',
    path: '/confirmation',
    noindex: true,
  });

export default function Confirmation() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <ConfirmationPage />
      </Suspense>
    </ClientOnly>
  );
}
