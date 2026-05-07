import { EventCanvasCustomizer } from '@/components/product-configs/event-canvas/customer-customizer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Event Canvas | Photify',
    description: 'Design a poster collage with your favourite photos.',
    path: '/customize/event-canvas',
    noindex: true,
  });

export default function EventCanvasPage() {
  return <EventCanvasCustomizer />;
}
