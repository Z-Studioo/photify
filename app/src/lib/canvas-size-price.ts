import type { Product } from '@/lib/data/types';
import type { InchData } from '@/utils/ratio-sizes';

/** Normalize a value from `products.config.sizePrices` JSON (number or string). */
function parseConfigSizePrice(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Single-canvas price for a print size: admin `products.config.sizePrices` JSON
 * (set in product config editor), then global `sizes.fixed_price`, then base × area.
 */
export function resolveCanvasSizePrice(
  size: InchData,
  product: Product | null | undefined
): number | null {
  const fromConfig = parseConfigSizePrice(
    product?.config?.sizePrices?.[size.id] as unknown
  );
  if (fromConfig != null) {
    return fromConfig;
  }

  if (
    size.fixed_price != null &&
    typeof size.fixed_price === 'number' &&
    size.fixed_price > 0
  ) {
    return size.fixed_price;
  }

  const raw = product?.price as string | number | undefined | null;
  const base =
    raw != null && raw !== '' ? Number(raw) : NaN;
  if (!Number.isNaN(base) && base > 0 && size.area_in2 > 0) {
    return base * size.area_in2;
  }

  return null;
}
