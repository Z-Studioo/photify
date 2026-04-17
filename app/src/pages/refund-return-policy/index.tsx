import { RefundReturnPolicyPage } from '@/components/pages/refund-return-policy';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function RefundReturnPolicy() {
  const title = 'Refund & Returns Policy | Photify';
  const description =
    "Read Photify's Refund and Returns Policy. Learn about our 7-day refund window, return process, and how we handle damaged or defective items.";

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
      <RefundReturnPolicyPage />
    </>
  );
}
