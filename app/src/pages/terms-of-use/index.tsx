import { TermsOfUsePage } from '@/components/pages/terms-of-use';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Terms of Use | Photify',
    description:
      "Read Photify's Terms of Use. By accessing our website and using our services, you agree to comply with these Terms of Service.",
    path: '/terms-of-use',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Terms of Use', path: '/terms-of-use' },
    ]),
  });

export default function TermsOfUse() {
  return <TermsOfUsePage />;
}
