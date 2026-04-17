import { ConfirmationPage } from '@/components/pages/confirmation';
import { NoIndex } from '@/components/shared/no-index';

export default function Confirmation() {
  return (
    <>
      <NoIndex title='Order Confirmation | Photify' />
      <ConfirmationPage />
    </>
  );
}
