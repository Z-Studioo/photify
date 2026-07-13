import type {
  PhotoPrintSizeConfig,
  PhotoPrintsProductConfig,
  ResolvedPrintSize,
} from './types';

export const MAX_PHOTOS = 50;
export const MIN_DPI = 300;

export const PHOTO_PRINTS_PRODUCT = {
  slug: 'photo-prints',
  name: 'Photo Prints',
  description:
    'Upload photos from your camera roll and order professional prints in standard sizes.',
};

/** Default print sizes when products.config.photoPrints is missing */
export const DEFAULT_PRINT_SIZES: PhotoPrintSizeConfig[] = [
  { id: '4x4', label: '4" × 4"', widthIn: 4, heightIn: 4, ratio: '1:1', price: 0.39, active: true },
  { id: '4x6', label: '4" × 6"', widthIn: 4, heightIn: 6, ratio: '2:3', price: 0.49, active: true },
  { id: '5x7', label: '5" × 7"', widthIn: 5, heightIn: 7, ratio: '5:7', price: 0.79, active: true },
  { id: '6x8', label: '6" × 8"', widthIn: 6, heightIn: 8, ratio: '3:4', price: 0.99, active: true },
  { id: '8x10', label: '8" × 10"', widthIn: 8, heightIn: 10, ratio: '4:5', price: 1.99, active: true },
  { id: '8x12', label: '8" × 12"', widthIn: 8, heightIn: 12, ratio: '2:3', price: 2.49, active: true },
  { id: '5x5', label: '5" × 5"', widthIn: 5, heightIn: 5, ratio: '1:1', price: 0.59, active: true },
  { id: '8x8', label: '8" × 8"', widthIn: 8, heightIn: 8, ratio: '1:1', price: 1.49, active: true },
];

export const PHOTO_PRINTS_DEFAULT_CONFIG: PhotoPrintsProductConfig = {
  maxPhotos: MAX_PHOTOS,
  minDpi: MIN_DPI,
  borderMode: 'borderless',
  sizes: DEFAULT_PRINT_SIZES,
};

const SESSION_KEY = 'photify_photo_prints_session_v1';

/** Merge product config with safe defaults */
export function resolvePhotoPrintsConfig(
  raw: unknown
): PhotoPrintsProductConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...PHOTO_PRINTS_DEFAULT_CONFIG, sizes: [...DEFAULT_PRINT_SIZES] };
  }

  const cfg = raw as Partial<PhotoPrintsProductConfig>;
  const sizes =
    Array.isArray(cfg.sizes) && cfg.sizes.length > 0
      ? cfg.sizes.filter(
          (s): s is PhotoPrintSizeConfig =>
            !!s &&
            typeof s === 'object' &&
            typeof s.id === 'string' &&
            typeof s.price === 'number'
        )
      : [...DEFAULT_PRINT_SIZES];

  return {
    maxPhotos:
      typeof cfg.maxPhotos === 'number' && cfg.maxPhotos > 0
        ? cfg.maxPhotos
        : MAX_PHOTOS,
    minDpi:
      typeof cfg.minDpi === 'number' && cfg.minDpi > 0 ? cfg.minDpi : MIN_DPI,
    borderMode: 'borderless',
    sizes,
  };
}

/** Active sizes only, sorted by area ascending */
export function getActivePrintSizes(
  config: PhotoPrintsProductConfig
): PhotoPrintSizeConfig[] {
  return config.sizes
    .filter(s => s.active && s.price > 0)
    .sort((a, b) => a.widthIn * a.heightIn - b.widthIn * b.heightIn);
}

/** Resolve print dimensions with optional landscape flip (squares unchanged) */
export function resolvePrintSize(
  size: PhotoPrintSizeConfig,
  landscape: boolean
): ResolvedPrintSize {
  const isSquare = size.widthIn === size.heightIn;
  const useLandscape = !isSquare && landscape;
  const widthIn = useLandscape ? size.heightIn : size.widthIn;
  const heightIn = useLandscape ? size.widthIn : size.heightIn;

  return {
    sizeId: size.id,
    label: `${widthIn}" × ${heightIn}"`,
    widthIn,
    heightIn,
    aspectRatio: widthIn / heightIn,
    price: size.price,
  };
}

/**
 * Pick the active print size whose aspect ratio best matches a photo's.
 * Orientation-independent (compares long-side / short-side ratios) since
 * orientation is auto-derived per photo. Falls back to the first active size.
 */
export function findClosestPrintSize(
  sizes: PhotoPrintSizeConfig[],
  photoWidthPx: number,
  photoHeightPx: number
): PhotoPrintSizeConfig | undefined {
  if (sizes.length === 0) return undefined;
  if (photoWidthPx <= 0 || photoHeightPx <= 0) return sizes[0];

  const photoRatio =
    Math.max(photoWidthPx, photoHeightPx) /
    Math.min(photoWidthPx, photoHeightPx);

  let best = sizes[0];
  let bestDiff = Infinity;
  for (const size of sizes) {
    const sizeRatio =
      Math.max(size.widthIn, size.heightIn) /
      Math.min(size.widthIn, size.heightIn);
    const diff = Math.abs(sizeRatio - photoRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = size;
    }
  }
  return best;
}

/** Effective DPI for a cropped image at the chosen print size */
export function computeEffectiveDpi(
  croppedLongSidePx: number,
  printLongSideIn: number
): number {
  if (printLongSideIn <= 0) return 0;
  return croppedLongSidePx / printLongSideIn;
}

export function loadPhotoPrintsSession(): Partial<import('./types').PhotoPrintsSessionState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePhotoPrintsSession(
  state: import('./types').PhotoPrintsSessionState
): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — ignore
  }
}

export function clearPhotoPrintsSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    //
  }
}
