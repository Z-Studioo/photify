import { SINGLE_CANVAS_PRODUCT } from './single-canvas/config';
import { COLLAGE_CANVAS_PRODUCT } from './1PhotoCollageCreator/config';
import { POSTER_COLLAGE_PRODUCT } from './poster-collage/config';

// Product type for registry
type ProductConfig = {
  product: any; // Flexible to support all product config types
  configType: string;
  hasCustomizer: boolean;
};

// Product registry - metadata only (no component imports!)
export const PRODUCT_REGISTRY: Record<string, ProductConfig> = {
  [SINGLE_CANVAS_PRODUCT.id]: {
    product: SINGLE_CANVAS_PRODUCT,
    configType: 'single-canvas',
    hasCustomizer: true
  },
  [SINGLE_CANVAS_PRODUCT.slug]: {
    product: SINGLE_CANVAS_PRODUCT,
    configType: 'single-canvas',
    hasCustomizer: true
  },
  [COLLAGE_CANVAS_PRODUCT.id]: {
    product: COLLAGE_CANVAS_PRODUCT,
    configType: '1PhotoCollageCreator',
    hasCustomizer: true
  },
  [COLLAGE_CANVAS_PRODUCT.slug]: {
    product: COLLAGE_CANVAS_PRODUCT,
    configType: '1PhotoCollageCreator',
    hasCustomizer: true
  },
  [POSTER_COLLAGE_PRODUCT.id]: {
    product: POSTER_COLLAGE_PRODUCT,
    configType: 'poster-collage',
    hasCustomizer: true
  },
  [POSTER_COLLAGE_PRODUCT.slug]: {
    product: POSTER_COLLAGE_PRODUCT,
    configType: 'poster-collage',
    hasCustomizer: true
  }
};

// Helper to get product config by ID or slug
export function getProductConfig(identifier: string) {
  return PRODUCT_REGISTRY[identifier];
}

// Helper to check if a product has a custom configurator
export function hasCustomConfigurator(identifier: string): boolean {
  return identifier in PRODUCT_REGISTRY;
}

// Helper to check if a product has a customer customizer
export function hasCustomerCustomizer(identifier: string): boolean {
  const config = PRODUCT_REGISTRY[identifier];
  return config?.hasCustomizer === true;
}

// Export product configs
export { SINGLE_CANVAS_PRODUCT } from './single-canvas/config';
export { COLLAGE_CANVAS_PRODUCT } from './1PhotoCollageCreator/config';
export { POSTER_COLLAGE_PRODUCT } from './poster-collage/config';
export type { SingleCanvasConfig } from './single-canvas/types';
export type { CollageConfig } from './1PhotoCollageCreator/types';

// Export shared 3D components
export * from './shared';

// NOTE: Components must be imported directly to avoid SSR issues:
// import { SingleCanvasConfigEditor } from '@/components/product-configs/single-canvas/ConfigEditor';
// import { SingleCanvasCustomizer } from '@/components/product-configs/single-canvas/CustomerCustomizer';
// import { CollageConfigEditor } from '@/components/product-configs/1PhotoCollageCreator/ConfigEditor';
// import { CollageCustomizer } from '@/components/product-configs/1PhotoCollageCreator/CustomerCustomizer';
// import { PosterCollageCustomizer } from '@/components/product-configs/poster-collage/CustomerCustomizer';

