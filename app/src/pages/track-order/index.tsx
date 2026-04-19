import { OrderTrackPage } from '@/components/pages/track-order';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Track Your Order | Photify',
    description:
      'Track your Photify order status and get real-time updates on your shipment. Enter your order details to stay informed.',
    path: '/track-order',
    // User-specific page — keep out of index to avoid thin / duplicate content.
    noindex: true,
  });

export default function TrackOrder() {
  return <OrderTrackPage />;
}
