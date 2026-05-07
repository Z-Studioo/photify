// Product Configurers Registry
// Defines all available product configurers and their metadata
// Used by admin panel to attach configurers to products

import { PREDEFINED_TEMPLATES } from '@/components/product-configs/1PhotoCollageCreator/types';
import { MULTI_CANVAS_WALL_SUPPORTED_RATIOS } from '@/components/product-configs/multi-canvas-wall/config';

export interface ProductConfigurer {
  id: string;                    // Unique identifier (matches route name)
  name: string;                  // Display name for admin panel
  description: string;           // Description of what this configurer does
  route: string;                 // URL route path (without /customize/ prefix)
  customUrl?: string;            // Override full URL (e.g. '/upload' for single-canvas)
  icon?: string;                 // Optional icon name from lucide-react
  requiresProductId: boolean;    // Whether this configurer needs a productId
  isActive: boolean;             // Whether this configurer is available
  /**
   * Short aspect ratio keys (e.g. '1:1', '2:3') that this configurer actually uses.
   * When provided, the admin Size & Pricing editor will hide all other ratios
   * because they'd have no effect on the customer experience.
   * When undefined, the configurer accepts any ratio the shop supports.
   */
  supportedAspectRatios?: string[];
  /**
   * Short aspect ratio keys that a customer can land on through this configurer's
   * templates/flow. If an admin enables this configurer but doesn't price any size
   * under one of these ratios, the customer will hit a dead end. Used for save-time
   * validation. Usually equal to or a subset of supportedAspectRatios.
   */
  requiredAspectRatios?: string[];
}

// Derive the unique ratios actually used by the Photo Collage Creator templates
// so the registry stays in sync with the template list automatically.
const COLLAGE_TEMPLATE_RATIOS: string[] = Array.from(
  new Set(PREDEFINED_TEMPLATES.map(t => t.aspectRatio))
);

/**
 * Registry of all available product configurers
 * 
 * IMPORTANT: Product3DView is NOT a configurer - it's a viewer/size selector
 * that configurers navigate to after creating the product.
 */
export const PRODUCT_CONFIGURERS: ProductConfigurer[] = [
  {
    id: 'photo-collage-creator',
    name: 'Photo Collage Creator',
    description: 'Create custom photo collages with multiple photos and templates',
    route: 'photo-collage-creator',
    icon: 'LayoutGrid',
    requiresProductId: false, // Creates its own product, then passes to 3D viewer
    isActive: true,
    // Collage templates lock the ratio — only the ratios used by PREDEFINED_TEMPLATES
    // are relevant. Other ratios in the admin UI would have no effect.
    supportedAspectRatios: COLLAGE_TEMPLATE_RATIOS,
    requiredAspectRatios: COLLAGE_TEMPLATE_RATIOS,
  },
  {
    id: 'single-canvas',
    name: 'Single Canvas Editor',
    description: 'Upload a single image and customise canvas size, crop, edge style and shape — uses the /upload dashboard editor',
    route: 'upload',
    customUrl: '/upload',
    icon: 'Image',
    requiresProductId: true,
    isActive: true
  },
  {
    id: 'multi-canvas-wall',
    name: 'Multi-Canvas Wall Gallery',
    description: 'Create a gallery wall with 3 custom canvases in a fixed layout',
    route: 'multi-canvas-wall',
    icon: 'LayoutGrid',
    requiresProductId: true, // Needs productId to fetch room backgrounds from product config
    isActive: true,
    // The 3-canvas horizontal layout only looks right with portrait or square
    // canvases — landscape ratios would produce an uncomfortably wide row.
    // No `requiredAspectRatios`: customers can buy with any subset, so admins
    // are free to price only some of the supported ratios.
    supportedAspectRatios: [...MULTI_CANVAS_WALL_SUPPORTED_RATIOS],
  },
  {
    id: 'event-canvas',
    name: 'Event Poster with Stand',
    description: 'Upload custom poster designs for weddings, birthdays, and special events - displayed on canvas stands',
    route: 'event-canvas',
    icon: 'Frame',
    requiresProductId: false, // Simple upload flow
    isActive: true
  },
  // Add more configurers here as they are created
  // Example:
  // {
  //   id: 'multi-panel-canvas',
  //   name: 'Multi-Panel Canvas',
  //   description: 'Split image across multiple canvas panels',
  //   route: 'multi-panel-canvas',
  //   icon: 'Columns',
  //   requiresProductId: true,
  //   isActive: true
  // },
];

/**
 * Get configurer by ID
 */
export function getConfigurerById(id: string): ProductConfigurer | undefined {
  return PRODUCT_CONFIGURERS.find(c => c.id === id);
}

/**
 * Get all active configurers
 */
export function getActiveConfigurers(): ProductConfigurer[] {
  return PRODUCT_CONFIGURERS.filter(c => c.isActive);
}

/**
 * Get configurers that can be attached to products
 * (Excludes 3D viewer and any non-configurer routes)
 */
export function getAttachableConfigurers(): ProductConfigurer[] {
  return PRODUCT_CONFIGURERS.filter(c => 
    c.isActive && 
    c.id !== 'product-3d-view' // Explicitly exclude 3D viewer
  );
}

/**
 * Build full configurator URL with optional productId
 */
export function buildConfiguratorUrl(configurerId: string, productId?: string): string {
  const configurer = getConfigurerById(configurerId);
  if (!configurer) {
    return '/customize';
  }

  // If the configurer declares a custom URL (e.g. single-canvas → /upload)
  if (configurer.customUrl) {
    if (productId) {
      return `${configurer.customUrl}?productId=${productId}&configurerType=${configurerId}`;
    }
    return configurer.customUrl;
  }

  const baseUrl = `/customize/${configurer.route}`;
  
  if (productId && configurer.requiresProductId) {
    return `${baseUrl}?productId=${productId}`;
  }
  
  return baseUrl;
}

/**
 * Validate if a configurer ID exists and is active
 */
export function isValidConfigurer(configurerId: string): boolean {
  const configurer = getConfigurerById(configurerId);
  return configurer !== undefined && configurer.isActive;
}

/**
 * Short ratio key for an aspect ratio row (e.g. `{width_ratio: 2, height_ratio: 3}` -> `'2:3'`).
 * Matches the keys used in `ProductConfigurer.supportedAspectRatios`.
 */
export function ratioKey(ratio: {
  width_ratio: number;
  height_ratio: number;
}): string {
  return `${ratio.width_ratio}:${ratio.height_ratio}`;
}

/**
 * Returns the list of ratio keys this configurer supports, or `null` if it
 * accepts any ratio. Callers use `null` to mean "no filtering".
 */
export function getSupportedAspectRatioKeys(
  configurerId: string | null | undefined
): string[] | null {
  if (!configurerId) return null;
  const c = getConfigurerById(configurerId);
  return c?.supportedAspectRatios ?? null;
}

/**
 * Returns the list of ratio keys whose absence would break the customer flow
 * for this configurer (e.g. template-locked ratios for collage), or `null` if
 * no such requirement exists.
 */
export function getRequiredAspectRatioKeys(
  configurerId: string | null | undefined
): string[] | null {
  if (!configurerId) return null;
  const c = getConfigurerById(configurerId);
  return c?.requiredAspectRatios ?? null;
}

