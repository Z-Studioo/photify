import { SINGLE_CANVAS_PRODUCT, COLLAGE_ON_SINGLE_CANVAS_PRODUCT } from './single-canvas/config';
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
    hasCustomizer: true,
  },
  [SINGLE_CANVAS_PRODUCT.slug]: {
    product: SINGLE_CANVAS_PRODUCT,
    configType: 'single-canvas',
    hasCustomizer: true,
  },
  [COLLAGE_ON_SINGLE_CANVAS_PRODUCT.id]: {
    product: SINGLE_CANVAS_PRODUCT,
    configType: 'single-canvas',
    hasCustomizer: true,
  },
  [COLLAGE_ON_SINGLE_CANVAS_PRODUCT.slug]: {
    product: SINGLE_CANVAS_PRODUCT,
    configType: 'single-canvas',
    hasCustomizer: true,
  },
  [COLLAGE_CANVAS_PRODUCT.id]: {
    product: COLLAGE_CANVAS_PRODUCT,
    configType: '1PhotoCollageCreator',
    hasCustomizer: true,
  },
  [COLLAGE_CANVAS_PRODUCT.slug]: {
    product: COLLAGE_CANVAS_PRODUCT,
    configType: '1PhotoCollageCreator',
    hasCustomizer: true,
  },
  [POSTER_COLLAGE_PRODUCT.id]: {
    product: POSTER_COLLAGE_PRODUCT,
    configType: 'poster-collage',
    hasCustomizer: true,
  },
  [POSTER_COLLAGE_PRODUCT.slug]: {
    product: POSTER_COLLAGE_PRODUCT,
    configType: 'poster-collage',
    hasCustomizer: true,
  },
};

export type ProductRegistryProduct = ProductConfig;

/** Resolve registry entry by DB id first, then by slug (for stable UUIDs not duplicated as keys). */
export function resolveProductRegistryEntry(product: {
  id: string;
  slug?: string | null;
}): ProductConfig | undefined {
  const byId = PRODUCT_REGISTRY[product.id];
  if (byId) return byId;
  if (product.slug) {
    return PRODUCT_REGISTRY[product.slug];
  }
  return undefined;
}

export function getProductConfig(product: {
  id: string;
  slug?: string | null;
}): ProductConfig | undefined {
  return resolveProductRegistryEntry(product);
}

export function hasCustomConfigurator(product: {
  id: string;
  slug?: string | null;
}): boolean {
  return !!resolveProductRegistryEntry(product);
}

export function hasCustomerCustomizer(product: {
  id: string;
  slug?: string | null;
}): boolean {
  return resolveProductRegistryEntry(product)?.hasCustomizer === true;
}

/** True when this product id uses the single-canvas admin editor + upload / 3D flow */
export function usesSingleCanvasConfigurator(productId: string): boolean {
  return PRODUCT_REGISTRY[productId]?.configType === 'single-canvas';
}

// Export product configs
export { SINGLE_CANVAS_PRODUCT, COLLAGE_ON_SINGLE_CANVAS_PRODUCT } from './single-canvas/config';
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
