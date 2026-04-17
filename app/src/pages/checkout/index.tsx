import { CheckoutPage } from '@/components/pages/checkout';
import { NoIndex } from '@/components/shared/no-index';

export default function Checkout() {
  return (
    <>
      <NoIndex title='Checkout | Photify' />
      <CheckoutPage />
    </>
  );
}
