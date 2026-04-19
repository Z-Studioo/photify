import { CartPage } from '@/components/pages/cart';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Your Cart | Photify',
    description: 'Review the items in your Photify cart before checkout.',
    path: '/cart',
    noindex: true,
  });

export default function Cart() {
  return <CartPage />;
}
