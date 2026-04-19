import { SingleCanvasCustomizer } from '@/components/product-configs/single-canvas/customer-customizer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Single Canvas | Photify',
    description: 'Customise your photo on a premium single canvas.',
    path: '/customize/single-canvas',
    noindex: true,
  });

export default function SingleCanvasCustomizePage() {
  return <SingleCanvasCustomizer />;
}
