import { PrivacyPolicyPage } from '@/components/pages/privacy-policy';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Privacy Policy | Photify',
    description:
      "Read Photify's Privacy Policy to understand how we collect, use, and protect your personal data in compliance with UK GDPR.",
    path: '/privacy-policy',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Privacy Policy', path: '/privacy-policy' },
    ]),
  });

export default function PrivacyPolicy() {
  return <PrivacyPolicyPage />;
}
