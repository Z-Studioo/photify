// Single Canvas Product - Configuration Constants
// Product ID: 00845beb-23c6-4d3b-8f55-a62eb956f182

/** Distinct DB row sharing the same single-canvas admin + upload flow (seed UUID must match) */
export const COLLAGE_ON_SINGLE_CANVAS_PRODUCT = {
  id: '7f3b2a9c-4d5e-6f70-8a9b-0c1d2e3f4a5b',
  slug: 'collage-on-single-canvas',
} as const;

export const SINGLE_CANVAS_PRODUCT = {
  id: '00845beb-23c6-4d3b-8f55-a62eb956f182',
  slug: 'single-canvas',
  name: 'Single Canvas',
  type: 'canvas' as const,
  description: 'High-quality single canvas print perfect for any room',
  
  // Configuration settings
  config: {
    // Which configuration tabs to show
    enabledTabs: {
      sizes: true,          // Always enabled - core feature
      materials: false,     // Can be enabled when ready
      finishes: false,      // Can be enabled when ready
      mounting: false       // Can be enabled when ready
    },
    
    // Validation rules
    validation: {
      minRatios: 1,
      minSizes: 1,
      requireMaterial: false,
      requireFinish: false
    },
    
    // UI customization
    ui: {
      showAreaInSizes: true,        // Show square inches in size cards
      allowBulkSelection: true,     // Show "Select All" buttons
      groupSizesByRatio: true       // Group sizes by aspect ratio
    }
  }
};

// Helper to check if this product matches a given ID or slug
export function isSingleCanvasProduct(identifier: string): boolean {
  return (
    identifier === SINGLE_CANVAS_PRODUCT.id ||
    identifier === SINGLE_CANVAS_PRODUCT.slug ||
    identifier === COLLAGE_ON_SINGLE_CANVAS_PRODUCT.id ||
    identifier === COLLAGE_ON_SINGLE_CANVAS_PRODUCT.slug
  );
}

