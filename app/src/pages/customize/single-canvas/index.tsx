import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const SingleCanvasCustomizer = lazy(() =>
  import('@/components/product-configs/single-canvas/customer-customizer').then(
    m => ({ default: m.SingleCanvasCustomizer })
  )
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Single Canvas | Photify',
    description: 'Customise your photo on a premium single canvas.',
    path: '/customize/single-canvas',
    noindex: true,
  });

export default function SingleCanvasCustomizePage() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <SingleCanvasCustomizer />
      </Suspense>
    </ClientOnly>
  );
}
