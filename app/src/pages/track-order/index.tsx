import { OrderTrackPage } from '@/components/pages/track-order';
import { NoIndex } from '@/components/shared/no-index';

export default function TrackOrder() {
  return (
    <>
      <NoIndex title='Track Order | Photify' />
      <OrderTrackPage />
    </>
  );
}
