// Poster Collage - Type Definitions
// Simple upload-based configurator for event posters

export interface PosterSize {
  width: number;           // in inches
  height: number;          // in inches
  label: string;           // e.g., "24" × 36""
  description: string;     // Description for customers
  aspectRatio: number;     // width/height ratio
  recommended?: boolean;   // Mark recommended size
}

export interface PosterUploadState {
  imageUrl: string | null;       // Uploaded image URL
  imageFile: File | null;         // Original file
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

