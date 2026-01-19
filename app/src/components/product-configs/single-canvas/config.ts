// Single Canvas Product - Configuration Constants
// Product ID: 00845beb-23c6-4d3b-8f55-a62eb956f182

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
  return identifier === SINGLE_CANVAS_PRODUCT.id || 
         identifier === SINGLE_CANVAS_PRODUCT.slug;
}

