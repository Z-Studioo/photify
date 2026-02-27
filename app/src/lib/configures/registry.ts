// Product Configurers Registry
// Defines all available product configurers and their metadata
// Used by admin panel to attach configurers to products

export interface ProductConfigurer {
  id: string;                    // Unique identifier (matches route name)
  name: string;                  // Display name for admin panel
  description: string;           // Description of what this configurer does
  route: string;                 // URL route path (without /customize/ prefix)
  icon?: string;                 // Optional icon name from lucide-react
  requiresProductId: boolean;    // Whether this configurer needs a productId
  isActive: boolean;             // Whether this configurer is available
}

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
    isActive: true
  },
  {
    id: 'single-canvas',
    name: 'Single Canvas Uploader',
    description: 'Upload a single image and customize canvas size',
    route: 'single-canvas',
    icon: 'Image',
    requiresProductId: false, // Handles its own flow
    isActive: true
  },
  {
    id: 'multi-canvas-wall',
    name: 'Multi-Canvas Wall Gallery',
    description: 'Create a gallery wall with 3 custom canvases in a fixed layout',
    route: 'multi-canvas-wall',
    icon: 'LayoutGrid',
    requiresProductId: true, // Needs productId to fetch room backgrounds from product config
    isActive: true
  },
  {
    id: 'poster-collage',
    name: 'Event Poster with Stand',
    description: 'Upload custom poster designs for weddings, birthdays, and special events - displayed on canvas stands',
    route: 'poster-collage',
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

