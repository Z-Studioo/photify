// Multi-Canvas Wall Configurer - Configuration Constants

export const MULTI_CANVAS_WALL_PRODUCT = {
  id: 'parallel-triplet-canvas',
  slug: 'parallel-triplet-canvas',
  name: 'Multi-Canvas Wall',
  type: 'canvas' as const,
  description: 'Create a stunning gallery wall with 4 custom canvases',
  
  // Configuration settings
  config: {
    // Canvas specifications
    canvasCount: 3,
    canvasWidth: 16,  // inches (changed from 20)
    canvasHeight: 32, // inches (changed from 30)
    
    // Layout configuration (positions in pixels at scale)
    // Three canvases in a horizontal row, vertically aligned
    layout: {
      // Scale factor for display (1 inch = 40 pixels in preview)
      scale: 40,
      
      // Canvas positions [x, y] in inches from top-left of wall
      // Creating a horizontal row with vertical alignment (moved up)
      positions: [
        { x: 18, y: 20 },   // Left canvas (moved up from y: 33)
        { x: 52, y: 20 },   // Center canvas (moved up)
        { x: 86, y: 20 },   // Right canvas (moved up)
      ],
      
      // Spacing between canvases
      horizontalSpacing: 18, // inches between canvases (adjusted for new size)
      verticalSpacing: 0,    // all at same vertical position
    },
    
    // Wall dimensions for visualization
    wall: {
      width: 120,  // inches (10 feet)
      height: 96,  // inches (8 feet)
      color: '#e8e8e0', // Warm light gray (fallback)
      backgroundImage: 'https://cdn.pixabay.com/photo/2018/03/04/09/51/space-3197611_1280.jpg',
    },
    
    // Available room backgrounds
    rooms: [
      {
        id: 'living-room',
        name: 'Living Room',
        imageUrl: 'https://cdn.pixabay.com/photo/2018/03/04/09/51/space-3197611_1280.jpg',
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=80',
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1600&q=80',
      },
    ],
    
    // Validation rules
    validation: {
      minUploads: 3, // All canvases must have images
      maxFileSize: 10, // MB
      allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    },
    
    // Canvas shadow for 3D effect
    shadow: {
      blur: 30,
      opacity: 0.4,
      offsetX: 0,
      offsetY: 8,
    },
  }
};

// Helper to convert inches to pixels at current scale
export function inchesToPx(inches: number): number {
  return inches * MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
}

// Helper to convert pixels to inches at current scale
export function pxToInches(px: number): number {
  return px / MULTI_CANVAS_WALL_PRODUCT.config.layout.scale;
}

// Get canvas dimensions in pixels
export function getCanvasDimensionsPx() {
  const { canvasWidth, canvasHeight } = MULTI_CANVAS_WALL_PRODUCT.config;
  return {
    width: inchesToPx(canvasWidth),
    height: inchesToPx(canvasHeight),
  };
}

// Get wall dimensions in pixels
export function getWallDimensionsPx() {
  const { width, height } = MULTI_CANVAS_WALL_PRODUCT.config.wall;
  return {
    width: inchesToPx(width),
    height: inchesToPx(height),
  };
}

// Get canvas positions in pixels
export function getCanvasPositionsPx() {
  return MULTI_CANVAS_WALL_PRODUCT.config.layout.positions.map(pos => ({
    x: inchesToPx(pos.x),
    y: inchesToPx(pos.y),
  }));
}

