import { PosterCollageCustomizer } from '@/components/product-configs/poster-collage/customer-customizer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Poster Collage | Photify',
    description: 'Design a poster collage with your favourite photos.',
    path: '/customize/poster-collage',
    noindex: true,
  });

export default function PosterCollagePage() {
  return <PosterCollageCustomizer />;
}
