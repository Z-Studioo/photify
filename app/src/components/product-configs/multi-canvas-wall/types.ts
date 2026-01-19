// Multi-Canvas Wall - TypeScript Type Definitions

export interface CanvasImage {
  id: number;
  imageUrl: string | null;
  imageFile: File | null;
  uploaded: boolean;
}

export interface CanvasPosition {
  x: number; // in inches
  y: number; // in inches
}

export interface WallDimensions {
  width: number;  // in inches
  height: number; // in inches
}

export interface RulerMeasurement {
  type: 'horizontal' | 'vertical' | 'dimension';
  startX: number; // in pixels
  startY: number; // in pixels
  endX: number;   // in pixels
  endY: number;   // in pixels
  label: string;  // e.g., "20"" or "10" spacing"
}

export interface Room {
  id: string;
  name: string;
  imageUrl: string;
}

export interface MultiCanvasWallState {
  canvases: CanvasImage[];
  showRulers: boolean;
  selectedCanvasId: number | null;
  selectedRoom: string; // room id
  customSpacing: number; // inches between canvases
}

