// 1Photo Collage Creator - Type Definitions

export interface CollageConfig {
  allowedTemplates: string[];   // Template IDs from database or predefined
  allowedCanvasSizes: string[]; // Size IDs from database
  allowedBackgrounds: Background[];
  minPhotos: number;
  maxPhotos: number;
  enableFreeform: boolean;      // Allow users to place photos anywhere
}

export interface Background {
  id: string;
  type: 'color' | 'pattern';
  value: string;  // Hex color or pattern URL
  name: string;
  active: boolean;
}

export interface CollageTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  type: 'grid' | 'freeform' | 'fixed-slots';
  config: GridConfig | FreeformConfig | FixedSlotsConfig;
  aspectRatio: '1:1' | '2:3' | '3:2'; // Aspect ratio determines canvas dimensions
  active: boolean;
}

// Grid Template (e.g., 2x2, 3x3, 4x4)
export interface GridConfig {
  rows: number;
  columns: number;
  spacing: number;      // Spacing between photos (pixels)
  padding: number;      // Padding around edges (pixels)
}

// Freeform Template (user places photos anywhere)
export interface FreeformConfig {
  minPhotoSize: number; // Minimum photo dimension (pixels)
  maxPhotoSize: number; // Maximum photo dimension (pixels)
  allowOverlap: boolean;
}

// Fixed Slots Template (pre-defined photo positions and sizes)
export interface FixedSlotsConfig {
  slots: PhotoSlot[];
}

export interface PhotoSlot {
  id: string;
  x: number;          // Position in pixels from left
  y: number;          // Position in pixels from top
  width: number;      // Width in pixels
  height: number;     // Height in pixels
  rotation?: number;  // Optional rotation in degrees
}

// Customer Selection State
export interface CollageSelection {
  templateId: string | null;
  canvasSizeId: string | null;
  canvasWidth: number;   // in inches
  canvasHeight: number;  // in inches
  backgroundId: string | null;
  backgroundColor: string;
  photos: CollagePhoto[];
}

export interface CollagePhoto {
  id: string;           // Unique ID for this photo file
  instanceId: string;   // Unique ID for this placement instance (allows same photo in multiple slots)
  file: File;
  url: string;          // Object URL for preview
  fabricId?: string;    // Fabric.js object ID
  x?: number;           // Position in pixels (on fabric canvas) - optional until placed
  y?: number;           // Position in pixels - optional until placed
  width?: number;       // Size in pixels - optional until placed
  height?: number;      // Size in pixels - optional until placed
  rotation: number;     // Rotation in degrees
  scale?: number;       // Scale factor - optional until placed
  slotId?: string;      // If using fixed-slots template - which slot it's in
  isPlaced: boolean;    // Whether the photo has been placed on canvas
  originalWidth: number;  // Original image dimensions
  originalHeight: number;
  // Crop data from CropModal
  cropX?: number;       // X coordinate of crop area in original image
  cropY?: number;       // Y coordinate of crop area in original image
  cropWidth?: number;   // Width of crop area in original image
  cropHeight?: number;  // Height of crop area in original image
}

// Predefined templates for quick start
export interface PredefinedTemplate extends CollageTemplate {
  previewImage?: string;
}

export const DEFAULT_COLLAGE_CONFIG: CollageConfig = {
  allowedTemplates: [],
  allowedCanvasSizes: [],
  allowedBackgrounds: [
    { id: 'white', type: 'color', value: '#ffffff', name: 'White', active: true },
    { id: 'black', type: 'color', value: '#000000', name: 'Black', active: true },
    { id: 'cream', type: 'color', value: '#f5f5dc', name: 'Cream', active: true },
    { id: 'gray', type: 'color', value: '#808080', name: 'Gray', active: true }
  ],
  minPhotos: 1,
  maxPhotos: 20,
  enableFreeform: true
};

// Predefined templates for customers to choose from
export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'grid-2x2',
    name: '2×2 Grid',
    description: 'Classic four-photo grid',
    type: 'grid',
    aspectRatio: '1:1',
    config: {
      rows: 2,
      columns: 2,
      spacing: 20,
      padding: 40
    },
    active: true
  },
  {
    id: 'grid-3x3',
    name: '3×3 Grid',
    description: 'Nine-photo collage',
    type: 'grid',
    aspectRatio: '1:1',
    config: {
      rows: 3,
      columns: 3,
      spacing: 15,
      padding: 30
    },
    active: true
  },
  {
    id: 'grid-2x3',
    name: '2×3 Grid',
    description: 'Six-photo portrait layout',
    type: 'grid',
    aspectRatio: '2:3',
    config: {
      rows: 3,
      columns: 2,
      spacing: 15,
      padding: 35
    },
    active: true
  },
  {
    id: 'grid-3x2',
    name: '3×2 Grid',
    description: 'Six-photo landscape layout',
    type: 'grid',
    aspectRatio: '3:2',
    config: {
      rows: 2,
      columns: 3,
      spacing: 15,
      padding: 35
    },
    active: true
  },
  {
    id: 'grid-4x4',
    name: '4×4 Grid',
    description: 'Sixteen-photo gallery',
    type: 'grid',
    aspectRatio: '1:1',
    config: {
      rows: 4,
      columns: 4,
      spacing: 12,
      padding: 25
    },
    active: true
  },
  {
    id: 'feature-left',
    name: 'Feature Left',
    description: 'Two photos left, three smaller right',
    type: 'fixed-slots',
    aspectRatio: '2:3',
    config: {
      slots: [
        { id: 'left-top', x: 40, y: 40, width: 360, height: 560, rotation: 0 },
        { id: 'left-bottom', x: 40, y: 620, width: 360, height: 560, rotation: 0 },
        { id: 'top-right', x: 420, y: 40, width: 340, height: 360, rotation: 0 },
        { id: 'mid-right', x: 420, y: 420, width: 340, height: 360, rotation: 0 },
        { id: 'bottom-right', x: 420, y: 800, width: 340, height: 360, rotation: 0 }
      ]
    },
    active: true
  },
  {
    id: 'scattered',
    name: 'Scattered Photos',
    description: 'Four overlapping photos',
    type: 'fixed-slots',
    aspectRatio: '3:2',
    config: {
      slots: [
        { id: 'photo1', x: 100, y: 100, width: 400, height: 350, rotation: -5 },
        { id: 'photo2', x: 450, y: 150, width: 380, height: 320, rotation: 8 },
        { id: 'photo3', x: 150, y: 500, width: 420, height: 360, rotation: -3 },
        { id: 'photo4', x: 550, y: 550, width: 350, height: 300, rotation: 6 }
      ]
    },
    active: true
  },
  {
    id: 'feature-layout-2x3',
    name: 'Feature Layout (Portrait)',
    description: 'Five photos - two left, three right',
    type: 'fixed-slots',
    aspectRatio: '2:3',
    config: {
      slots: [
        // Two photos on the left (stacked vertically)
        { id: 'left-top', x: 40, y: 40, width: 360, height: 560, rotation: 0 },
        { id: 'left-bottom', x: 40, y: 620, width: 360, height: 560, rotation: 0 },
        
        // Three photos on the right (stacked vertically, equal sizes with 40px right padding)
        { id: 'right-top', x: 420, y: 40, width: 340, height: 373, rotation: 0 },
        { id: 'right-middle', x: 420, y: 433, width: 340, height: 373, rotation: 0 },
        { id: 'right-bottom', x: 420, y: 826, width: 340, height: 374, rotation: 0 }
      ]
    },
    active: true
  },
  {
    id: 'feature-layout-3x2',
    name: 'Feature Layout (Landscape)',
    description: 'Five photos - two left, three right',
    type: 'fixed-slots',
    aspectRatio: '3:2',
    config: {
      slots: [
        // Two photos on the left (stacked vertically with proper spacing)
        { id: 'left-top', x: 40, y: 40, width: 540, height: 340, rotation: 0 },
        { id: 'left-bottom', x: 40, y: 400, width: 540, height: 360, rotation: 0 },
        
        // Three photos on the right (stacked vertically, equal sizes with proper spacing)
        { id: 'right-top', x: 600, y: 40, width: 560, height: 227, rotation: 0 },
        { id: 'right-middle', x: 600, y: 287, width: 560, height: 226, rotation: 0 },
        { id: 'right-bottom', x: 600, y: 533, width: 560, height: 227, rotation: 0 }
      ]
    },
    active: true
  }
];

