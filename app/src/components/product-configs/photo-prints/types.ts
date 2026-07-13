/** A single print size stored in products.config.photoPrints.sizes */
export interface PhotoPrintSizeConfig {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
  /** Short ratio key, e.g. "2:3", "1:1" */
  ratio: string;
  price: number;
  active: boolean;
}

/** Product-local Photo Prints configuration under products.config.photoPrints */
export interface PhotoPrintsProductConfig {
  maxPhotos: number;
  minDpi: number;
  borderMode: 'borderless';
  sizes: PhotoPrintSizeConfig[];
}

/** Resolved print dimensions for a photo (orientation may flip width/height) */
export interface ResolvedPrintSize {
  sizeId: string;
  label: string;
  widthIn: number;
  heightIn: number;
  aspectRatio: number;
  price: number;
}

/** One uploaded photo in the batch customizer */
export interface PhotoPrintItem {
  id: string;
  originalUrl: string;
  previewUrl: string;
  /** Full-resolution crop blob for print upload */
  croppedBlob?: Blob;
  croppedPreviewUrl?: string;
  croppedWidthPx?: number;
  croppedHeightPx?: number;
  sizeId: string;
  quantity: number;
  /** When true, swap width/height for rectangular sizes */
  landscape: boolean;
}

export interface PhotoPrintsSessionState {
  productId: string | null;
  productName: string;
  items: PhotoPrintItem[];
  applySizeId: string | null;
}

export interface CropModalState {
  isOpen: boolean;
  itemId: string | null;
}
