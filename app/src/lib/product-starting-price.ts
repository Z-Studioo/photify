/**
 * Lowest GBP price from `products.config.sizePrices` (generic configuration editor),
 * e.g. products edited like dual-metal-harmony with per-size prices in admin.
 * When `allowedSizes` is set, only those size IDs are considered.
 */
export function getLowestSizePriceFromConfig(config: unknown): number | null {
  if (!config || typeof config !== 'object') return null;
  const c = config as Record<string, unknown>;
  const sizePrices = c.sizePrices;
  if (!sizePrices || typeof sizePrices !== 'object') return null;

  const allowedSizes = Array.isArray(c.allowedSizes)
    ? (c.allowedSizes as string[])
    : null;

  const values: number[] = [];
  for (const [sizeId, raw] of Object.entries(
    sizePrices as Record<string, unknown>
  )) {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (allowedSizes && allowedSizes.length > 0 && !allowedSizes.includes(sizeId)) {
      continue;
    }
    values.push(n);
  }
  if (values.length === 0) return null;
  return Math.min(...values);
}

/** Display helper for GBP amounts from size prices */
export function formatGbpAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '';
  return amount % 1 === 0 ? String(Math.round(amount)) : amount.toFixed(2);
}

/**
 * Price for product cards / listings: lowest `config.sizePrices` (respecting
 * `allowedSizes`), then `fixed_price`, then base `price`.
 */
export function getListingDisplayAmount(product: {
  config?: unknown;
  fixed_price?: number | null;
  price: number | string;
}): number | null {
  const min = getLowestSizePriceFromConfig(product.config);
  if (min != null) return min;
  if (
    product.fixed_price != null &&
    typeof product.fixed_price === 'number' &&
    Number.isFinite(product.fixed_price)
  ) {
    return product.fixed_price;
  }
  const p = product.price;
  if (typeof p === 'number' && Number.isFinite(p)) return p;
  if (typeof p === 'string') {
    const n = parseFloat(String(p).replace(/£/g, '').trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}
