import { CheckoutPage } from '@/components/pages/checkout';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Checkout | Photify',
    description: 'Complete your Photify order securely.',
    path: '/checkout',
    noindex: true,
  });

export default function Checkout() {
  return <CheckoutPage />;
}
