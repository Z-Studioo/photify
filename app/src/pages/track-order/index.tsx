import { OrderTrackPage } from '@/components/pages/track-order';
import { Helmet } from '@dr.pogodin/react-helmet';

export default function TrackOrder() {
  return (
  <>
    <Helmet>
      <title>Track Order | Photify</title>
      <meta
        name="description"
        content="Track your Photify order status and get real-time updates on your shipment. Enter your order details to stay informed."
      />
      <meta name="robots" content="index,follow" />
    </Helmet>
    <OrderTrackPage />
  </>
);
}

