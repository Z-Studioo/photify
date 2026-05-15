import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const CollageCustomizer = lazy(() =>
  import(
    '@/components/product-configs/1PhotoCollageCreator/customer-customizer'
  ).then(m => ({ default: m.CollageCustomizer }))
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Create Your Photo Collage | Photify',
    description: 'Build a photo collage on a single canvas.',
    path: '/customize/photo-collage-creator',
    noindex: true,
  });

export default function PhotoCollageCreatorPage() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <CollageCustomizer />
      </Suspense>
    </ClientOnly>
  );
}
