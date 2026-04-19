import { MultiCanvasWallCustomizer } from '@/components/product-configs/multi-canvas-wall/customer-customizer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Customise Your Multi-Canvas Wall | Photify',
    description: 'Design a multi-canvas wall arrangement with your photos.',
    path: '/customize/multi-canvas-wall',
    noindex: true,
  });

export default function MultiCanvasWallPage() {
  return <MultiCanvasWallCustomizer />;
}
