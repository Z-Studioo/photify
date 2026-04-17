import { TermsOfUsePage } from '@/components/pages/terms-of-use';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function TermsOfUse() {
  const title = 'Terms of Use | Photify';
  const description =
    "Read Photify's Terms of Use. By accessing our website and using our services, you agree to comply with these Terms of Service.";

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
      <TermsOfUsePage />
    </>
  );
}
