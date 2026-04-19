import { ContactPage } from '@/components/pages/contact';
import { breadcrumbJsonLd, buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Contact Us | Photify',
    description:
      "Get in touch with the Photify team for support, order inquiries, or feedback. We're here to help with all your photo product needs.",
    path: '/contact',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
  });

export default function Contact() {
  return <ContactPage />;
}
