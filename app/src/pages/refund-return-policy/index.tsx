import { RefundReturnPolicyPage } from '@/components/pages/refund-return-policy';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function RefundReturnPolicy() {
  return (
    <>
      <Helmet>
        <title>Refund & Returns Policy | Photify</title>
        <meta
          name="description"
          content="Read Photify's Refund and Returns Policy. Learn about our 7-day refund window, return process, and how we handle damaged or defective items."
        />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <RefundReturnPolicyPage />
    </>
  );
}
