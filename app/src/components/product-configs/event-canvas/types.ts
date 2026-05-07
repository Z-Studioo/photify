// Event Canvas - Type Definitions
// Wizard-based configurator: customer either uploads their own banner or
// designs from a static template, then picks a size with 3D preview.

export interface PosterSize {
  width: number;           // in inches
  height: number;          // in inches
  label: string;           // e.g., "24" × 36""
  description: string;     // Description for customers
  aspectRatio: number;     // width/height ratio
  recommended?: boolean;   // Mark recommended size
}

/**
 * Wizard steps. Order matters for the back-button logic in the customizer.
 *
 * - choose:  pick "upload" or "template"
 * - upload:  drag-and-drop their own banner
 * - gallery: browse static templates grouped by occasion
 * - design:  edit text + drop photos into a chosen template
 * - size:    pick poster size + 3D preview, then add to cart
 */
export type EventCanvasStep =
  | 'choose'
  | 'upload'
  | 'gallery'
  | 'design'
  | 'size';

export interface PosterUploadState {
  step: EventCanvasStep;          // Current wizard step
  templateId: string | null;      // Selected template id (when path === 'template')
  imageUrl: string | null;        // Final composite URL used for cart + 3D preview
  imageFile: File | null;         // Original file (only set on direct uploads)
  selectedSizeId: string | null;  // Selected poster size ID
  posterWidth: number;            // Selected width in inches
  posterHeight: number;           // Selected height in inches
  isUploading: boolean;           // Upload in progress
  uploadProgress: number;         // Upload progress (0-100)
}

export interface WhatsAppDesignService {
  phoneNumber: string;
  message: string;
  url: () => string;
}
