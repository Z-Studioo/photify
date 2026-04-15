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
