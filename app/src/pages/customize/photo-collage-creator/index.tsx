import { CollageCustomizer } from '@/components/product-configs/1PhotoCollageCreator/customer-customizer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Create Your Photo Collage | Photify',
    description: 'Build a photo collage on a single canvas.',
    path: '/customize/photo-collage-creator',
    noindex: true,
  });

export default function PhotoCollageCreatorPage() {
  return <CollageCustomizer />;
}
