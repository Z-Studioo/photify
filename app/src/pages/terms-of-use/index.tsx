import { TermsOfUsePage } from '@/components/pages/terms-of-use';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function TermsOfUse() {
  return (
    <>
      <Helmet>
        <title>Terms of Use | Photify</title>
        <meta
          name="description"
          content="Read Photify's Terms of Use. By accessing our website and using our services, you agree to comply with these Terms of Service."
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <TermsOfUsePage />
    </>
  );
}
