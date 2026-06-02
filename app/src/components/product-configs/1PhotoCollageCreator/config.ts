// 1Photo Collage Creator Product - Configuration Constants
// Use this UUID when inserting the product in Supabase (see seeds / admin)

export const COLLAGE_CANVAS_PRODUCT = {
  id: '33445566-7788-99aa-bbcc-ddeeff001122',
  slug: 'photo-collage-creator',
  name: 'Photo Collage Creator',
  type: 'canvas' as const,
  description: 'Create beautiful photo collages on canvas with customizable templates',
  
  // Configuration settings
  config: {
    // Which configuration tabs to show
    enabledTabs: {
      templates: true,      // Template selection
      sizes: true,          // Canvas sizes
      backgrounds: true,    // Background colors/patterns
      materials: false,     // Can be enabled when ready
      finishes: false,      // Can be enabled when ready
      mounting: false       // Can be enabled when ready
    },
    
    // Validation rules
    validation: {
      minPhotos: 1,
      maxPhotos: 20,
      minCanvasSizes: 1,
      requireTemplate: false, // Allow freeform collage without template
    },
    
    // UI customization
    ui: {
      showGridGuides: true,
      enableSnapToGrid: true,
      showDimensionLabels: true,
      enablePhotoRotation: true,
      enablePhotoBorders: true
    }
  }
};

// Helper to check if this product matches a given ID or slug
export function isCollageCanvasProduct(identifier: string): boolean {
  return identifier === COLLAGE_CANVAS_PRODUCT.id || 
         identifier === COLLAGE_CANVAS_PRODUCT.slug;
}

// Default canvas sizes for collages (in inches)
export const DEFAULT_COLLAGE_SIZES = [
  { width: 16, height: 20, label: '16" x 20"' },
  { width: 20, height: 20, label: '20" x 20" (Square)' },
  { width: 20, height: 30, label: '20" x 30"' },
  { width: 24, height: 36, label: '24" x 36"' },
  { width: 30, height: 40, label: '30" x 40"' },
];

// DPI used for the in-browser fabric.js editor canvas. Kept intentionally low
// so the editor stays responsive (a 24" canvas only needs ~1200 px on screen);
// the final print-ready export is upscaled separately via PRINT_EXPORT_MULTIPLIER.
export const CANVAS_DPI = 50;

// Target DPI for the final print-ready PNG that gets uploaded to storage and
// sent to the printer. 300 DPI is the industry standard for canvas/photo
// prints and keeps the exported file size manageable for uploads.
export const PRINT_DPI = 300;

// Multiplier passed to fabric.Canvas#toDataURL when generating the print file.
// Upscales the low-res editor render (CANVAS_DPI) to print resolution (PRINT_DPI)
// without ever materialising a 600 DPI canvas in the browser.
export const PRINT_EXPORT_MULTIPLIER = PRINT_DPI / CANVAS_DPI;

// Pixels per inch conversion
export function inchesToPixels(inches: number): number {
  return inches * CANVAS_DPI;
}

export function pixelsToInches(pixels: number): number {
  return pixels / CANVAS_DPI;
}

// Get canvas dimensions based on aspect ratio
// Base size is 20 inches for the larger dimension
export function getCanvasDimensionsFromAspectRatio(aspectRatio: '1:1' | '2:3' | '3:2'): { width: number; height: number; label: string } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 20, height: 20, label: '20" × 20" (Square)' };
    case '2:3':
      return { width: 16, height: 24, label: '16" × 24" (Portrait)' };
    case '3:2':
      return { width: 24, height: 16, label: '24" × 16" (Landscape)' };
    default:
      return { width: 20, height: 20, label: '20" × 20" (Square)' };
  }
}

