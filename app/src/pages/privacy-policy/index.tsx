import { PrivacyPolicyPage } from '@/components/pages/privacy-policy';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Photify</title>
        <meta
          name="description"
          content="Read Photify's Privacy Policy to understand how we collect, use, and protect your personal data in compliance with UK GDPR."
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <PrivacyPolicyPage />
    </>
  );
}
