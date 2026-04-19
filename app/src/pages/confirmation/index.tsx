import { ConfirmationPage } from '@/components/pages/confirmation';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Order Confirmation | Photify',
    description: 'Your Photify order has been received.',
    path: '/confirmation',
    noindex: true,
  });

export default function Confirmation() {
  return <ConfirmationPage />;
}
