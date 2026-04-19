import { RefundReturnPolicyPage } from '@/components/pages/refund-return-policy';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Refund & Returns Policy | Photify',
    description:
      "Read Photify's Refund and Returns Policy. Learn about our 7-day refund window, return process, and how we handle damaged or defective items.",
    path: '/refund-return-policy',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Refund & Returns Policy', path: '/refund-return-policy' },
    ]),
  });

export default function RefundReturnPolicy() {
  return <RefundReturnPolicyPage />;
}
