import { lazy, Suspense } from 'react';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

const EventCanvasCustomizer = lazy(() =>
  import('@/components/product-configs/event-canvas/customer-customizer').then(
    m => ({ default: m.EventCanvasCustomizer })
  )
);

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Event Canvas | Photify',
    description: 'Design a poster collage with your favourite photos.',
    path: '/customize/event-canvas',
    noindex: true,
  });

export default function EventCanvasPage() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <EventCanvasCustomizer />
      </Suspense>
    </ClientOnly>
  );
}
