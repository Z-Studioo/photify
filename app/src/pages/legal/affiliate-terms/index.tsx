import { AffiliateTermsPage } from '@/components/pages/legal/affiliate-terms';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Affiliate Program Terms | Photify',
    description:
      "Read the Photify Affiliate Program Terms — commission rate, attribution window, holding period, payout schedule, brand-bidding rules, disclosure obligations, and partner conduct.",
    path: '/legal/affiliate-terms',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Legal', path: '/legal/affiliate-terms' },
      { name: 'Affiliate Program Terms', path: '/legal/affiliate-terms' },
    ]),
  });

export default function AffiliateTerms() {
  return <AffiliateTermsPage />;
}
