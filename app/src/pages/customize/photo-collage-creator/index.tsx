import { CollageCustomizer } from '@/components/product-configs/1PhotoCollageCreator/customer-customizer';
import { NoIndex } from '@/components/shared/no-index';

export default function PhotoCollageCreatorPage() {
  return (
    <>
      <NoIndex title='Photo Collage Creator | Photify' />
      <CollageCustomizer />
    </>
  );
}
