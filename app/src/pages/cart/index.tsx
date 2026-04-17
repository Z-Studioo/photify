import { CartPage } from '@/components/pages/cart';
import { NoIndex } from '@/components/shared/no-index';

export default function Cart() {
  return (
    <>
      <NoIndex title='Cart | Photify' />
      <CartPage />
    </>
  );
}
