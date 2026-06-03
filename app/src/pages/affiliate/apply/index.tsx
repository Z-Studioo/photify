import { AffiliateApplyPage } from '@/components/pages/affiliate/affiliate-apply';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Become a Partner | Photify Affiliate Program',
    description:
      'Apply to the Photify Partner Program. Earn 10% commission on every order you refer — your link, your discount, your dashboard.',
    path: '/affiliate/apply',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Affiliate Program', path: '/affiliate' },
      { name: 'Apply', path: '/affiliate/apply' },
    ]),
  });

export default function AffiliateApply() {
  return <AffiliateApplyPage />;
}
