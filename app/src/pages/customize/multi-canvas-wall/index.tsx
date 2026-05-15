import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const MultiCanvasWallCustomizer = lazy(() =>
  import(
    '@/components/product-configs/multi-canvas-wall/customer-customizer'
  ).then(m => ({ default: m.MultiCanvasWallCustomizer }))
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Multi-Canvas Wall | Photify',
    description: 'Design a multi-canvas wall arrangement with your photos.',
    path: '/customize/multi-canvas-wall',
    noindex: true,
  });

export default function MultiCanvasWallPage() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <MultiCanvasWallCustomizer />
      </Suspense>
    </ClientOnly>
  );
}
