import { PrivacyPolicyPage } from '@/components/pages/privacy-policy';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function PrivacyPolicy() {
  const title = 'Privacy Policy | Photify';
  const description =
    "Read Photify's Privacy Policy to understand how we collect, use, and protect your personal data in compliance with UK GDPR.";

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='robots' content='index,follow' />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
      </Helmet>
      <PrivacyPolicyPage />
    </>
  );
}
