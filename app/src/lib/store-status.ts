// Store open/close status — shared contract for the `store_status` row in
// `site_settings`. The server has a mirrored check in
// `server/src/lib/store-status.ts`; keep the shape and semantics in sync.

export const STORE_STATUS_KEY = 'store_status';

export interface StoreStatus {
  closed: boolean;
  /** YYYY-MM-DD. The store automatically reopens at the start of this day. */
  reopen_date: string | null;
  /** Optional custom copy shown on the closed screen. */
  message: string;
}

export const DEFAULT_STORE_STATUS: StoreStatus = {
  closed: false,
  reopen_date: null,
  message: '',
};

export function parseStoreStatus(value: unknown): StoreStatus {
  if (!value || typeof value !== 'object') return DEFAULT_STORE_STATUS;
  const v = value as Record<string, unknown>;
  return {
    closed: v.closed === true,
    reopen_date:
      typeof v.reopen_date === 'string' && v.reopen_date !== ''
        ? v.reopen_date
        : null,
    message: typeof v.message === 'string' ? v.message : '',
  };
}

/**
 * Closed until the reopen date (if one is set), then automatically open
 * again — the admin toggle doesn't need to be flipped back on the day.
 */
export function isStoreCurrentlyClosed(
  status: StoreStatus,
  now: Date = new Date()
): boolean {
  if (!status.closed) return false;
  if (!status.reopen_date) return true;
  const reopen = new Date(`${status.reopen_date}T00:00:00`);
  // Unparseable date — stay closed; the admin explicitly flipped the switch.
  if (Number.isNaN(reopen.getTime())) return true;
  return now < reopen;
}

export function formatReopenDate(reopenDate: string): string | null {
  const date = new Date(`${reopenDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
