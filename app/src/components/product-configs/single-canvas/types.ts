// Single Canvas Product - Type Definitions
// Product ID: 00845beb-23c6-4d3b-8f55-a62eb956f182

export interface SingleCanvasConfig {
  // Core configuration
  allowedRatios: string[];  // Aspect ratio IDs from database
  allowedSizes: string[];   // Size IDs from database
  
  // Optional: Material options (can be enabled later)
  materials?: MaterialOption[];
  
  // Optional: Finish options (can be enabled later)
  finishes?: FinishOption[];
  
  // Optional: Mounting options (can be enabled later)
  mounting?: MountingOption[];
}

export interface MaterialOption {
  id: string;
  name: string;
  description?: string;
  priceMultiplier: number; // 1.0 = no change, 1.2 = 20% more
  active: boolean;
}

export interface FinishOption {
  id: string;
  name: string;
  description?: string;
  priceMultiplier: number;
  active: boolean;
}

export interface MountingOption {
  id: string;
  name: string;
  description?: string;
  priceAdd: number; // Fixed price addition in currency
  active: boolean;
}

// Default configuration for Single Canvas
export const DEFAULT_SINGLE_CANVAS_CONFIG: SingleCanvasConfig = {
  allowedRatios: [],
  allowedSizes: []
  // Materials, finishes, and mounting can be added later
};

