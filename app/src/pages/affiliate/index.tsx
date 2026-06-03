import { AffiliateLandingPage } from '@/components/pages/affiliate/affiliate-landing';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Affiliate Program | Photify',
    description:
      'Earn 10% commission on every Photify order you refer. Join the affiliate program — your link, your discount, your dashboard.',
    path: '/affiliate',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Affiliate Program', path: '/affiliate' },
    ]),
  });

export default function Affiliate() {
  return <AffiliateLandingPage />;
}
