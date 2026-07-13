/** Compact GBP amount without currency symbol (e.g. product cards). */
export function formatGbpAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '';
  return amount % 1 === 0 ? String(Math.round(amount)) : amount.toFixed(2);
}

/** Standard GBP display with symbol. */
export function formatGbp(amount: number, options?: { alwaysDecimals?: boolean }): string {
  if (!Number.isFinite(amount)) return '£—';
  if (options?.alwaysDecimals) return `£${amount.toFixed(2)}`;
  return amount % 1 === 0 ? `£${Math.round(amount)}` : `£${amount.toFixed(2)}`;
}

/** Split whole / cents for large stylised price blocks. */
export function splitGbpParts(amount: number): { whole: string; cents: string } {
  const safe = Number.isFinite(amount) ? amount : 0;
  const fixed = safe.toFixed(2);
  const [whole, cents] = fixed.split('.');
  return { whole, cents };
}
