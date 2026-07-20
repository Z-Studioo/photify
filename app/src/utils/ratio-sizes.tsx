import { createClient } from '@/lib/supabase/client';
export interface InchData {
  id: string;
  aspect_ratio_id: string;
  width_in: number;
  height_in: number;
  display_label: string;
  area_in2: number;
  long_side_in: number;
  short_side_in: number;
  fixed_price: number | null;
  active: boolean;
  created_at: string;
}

export interface RatioData {
  id: string;
  label: string;
  width_ratio: number;
  height_ratio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  active: boolean;
  created_at: string;
  sizes: InchData[];
}

export async function fetchRatios(): Promise<RatioData[]> {
  const supabase = createClient();

  const { data: ratiosData, error: ratiosError } = await supabase
    .from('aspect_ratios')
    .select('*')
    .order('orientation', { ascending: true })
    .order('label', { ascending: true });

  if (ratiosError) throw ratiosError;

  const { data: sizesData, error: sizesError } = await supabase
    .from('sizes')
    .select('*')
    .order('width_in', { ascending: true });

  if (sizesError) throw sizesError;

  const ratiosWithSizes: RatioData[] = (ratiosData ?? [])
    .map(ratio => ({
      ...ratio,
      label: ratio.label.split(' ')[0],
      sizes: (sizesData ?? []).filter(
        size => size.aspect_ratio_id === ratio.id
      ),
    }))
    .sort((a, b) => {
      const [aw, ah] = a.label.split(':').map(Number);
      const [bw, bh] = b.label.split(':').map(Number);

      //Square always first
      if (aw === ah && bw !== bh) return -1;
      if (bw === bh && aw !== ah) return 1;

      // Then sort by ratio value
      return aw / ah - bw / bh;
    });

  return ratiosWithSizes;
}

export function getAllPrintSizes(ratios: RatioData[]): InchData[] {
  const allSizesSet = new Set<InchData>();
  ratios.forEach(ratio => {
    ratio.sizes.forEach(size => allSizesSet.add(size));
  });
  return Array.from(allSizesSet);
}

/** Numeric aspect value of a ratio, from DB columns with label fallback. */
export function getRatioValue(ratio: RatioData): number {
  if (ratio.width_ratio > 0 && ratio.height_ratio > 0) {
    return ratio.width_ratio / ratio.height_ratio;
  }
  const [w, h] = ratio.label.split(':').map(Number);
  return w > 0 && h > 0 ? w / h : 1;
}

/**
 * Ratio (with at least one size) closest to the image aspect — the single
 * source of truth for "Match my photo".
 */
export function findClosestRatio(
  imageAspectRatio: number,
  ratios: RatioData[]
): RatioData | null {
  const validRatios = ratios.filter(r => r.sizes.length > 0);
  if (!validRatios.length) return null;

  return validRatios.reduce((closest, current) => {
    const closestDiff = Math.abs(
      Math.log(getRatioValue(closest) / imageAspectRatio)
    );
    const currentDiff = Math.abs(
      Math.log(getRatioValue(current) / imageAspectRatio)
    );
    return currentDiff < closestDiff ? current : closest;
  });
}

/** Smallest (cheapest) active size of a ratio, or null when none exist. */
export function getSmallestSize(ratio: RatioData): InchData | null {
  return (
    [...ratio.sizes]
      .filter(s => s.active !== false)
      .sort((a, b) => a.area_in2 - b.area_in2)[0] ?? null
  );
}

/** Resolve an image source's aspect ratio (width / height), null on failure. */
export function getImageAspectRatio(src: string): Promise<number | null> {
  return new Promise(resolve => {
    const image = new window.Image();
    image.onload = () => {
      if (!image.width || !image.height) {
        resolve(null);
        return;
      }
      resolve(image.width / image.height);
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
