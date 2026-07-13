import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const PhotoPrintsCustomizer = lazy(() =>
  import('@/components/product-configs/photo-prints/customer-customizer').then(
    m => ({ default: m.PhotoPrintsCustomizer })
  )
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Order Photo Prints | Photify',
    description:
      'Upload photos from your camera roll and order professional prints in standard sizes.',
    path: '/customize/photo-prints',
    noindex: true,
  });

export default function PhotoPrintsPage() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <PhotoPrintsCustomizer />
      </Suspense>
    </ClientOnly>
  );
}
