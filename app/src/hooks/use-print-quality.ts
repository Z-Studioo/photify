import { useEffect, useState } from 'react';
import type { InchData } from '@/utils/ratio-sizes';

/** Ideal print resolution; below this the customer must consent to proceed. */
export const TARGET_PRINT_DPI = 300;
/** Below this the print will be visibly soft — flagged red in the UI. */
export const LOW_PRINT_DPI = 150;

export interface ImageDims {
  width: number;
  height: number;
}

/** Resolve the natural pixel dimensions of an image source (data URL or URL). */
export function useImageDimensions(
  src: string | null | undefined
): ImageDims | null {
  const [dims, setDims] = useState<ImageDims | null>(null);

  useEffect(() => {
    if (!src) {
      setDims(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setDims(
        img.naturalWidth && img.naturalHeight
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null
      );
    };
    img.onerror = () => {
      if (!cancelled) setDims(null);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return dims;
}

/** Effective DPI when printing `dims` at the given size, or null if unknown. */
export function computePrintDpi(
  dims: ImageDims | null,
  size: Pick<InchData, 'width_in' | 'height_in'> | null | undefined
): number | null {
  if (!dims || !size || size.width_in <= 0 || size.height_in <= 0) {
    return null;
  }
  return Math.floor(
    Math.min(dims.width / size.width_in, dims.height / size.height_in)
  );
}

export type PrintQualityLevel = 'excellent' | 'good' | 'low';

export function printQualityLevel(dpi: number): PrintQualityLevel {
  if (dpi >= TARGET_PRINT_DPI) return 'excellent';
  if (dpi >= LOW_PRINT_DPI) return 'good';
  return 'low';
}
