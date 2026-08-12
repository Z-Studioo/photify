import { supabase } from '@/lib/supabase';

// Mirror of the frontend contract in `app/src/lib/store-status.ts` — the
// `store_status` row in `site_settings`, managed from /admin/settings.

export const STORE_CLOSED_ERROR =
  'The store is temporarily closed and not accepting new orders.';

/**
 * Whether the store is currently closed to new orders. Closed until the
 * reopen date (if set), then automatically open again. Fails open: a
 * settings read hiccup must never block a paying customer.
 */
export async function isStoreClosed(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'store_status')
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('[store-status] failed to read store_status:', error);
      }
      return false;
    }

    const value = (data.setting_value ?? {}) as {
      closed?: unknown;
      reopen_date?: unknown;
    };

    if (value.closed !== true) return false;
    if (typeof value.reopen_date !== 'string' || value.reopen_date === '') {
      return true;
    }

    const reopen = new Date(`${value.reopen_date}T00:00:00`);
    // Unparseable date — stay closed; the admin explicitly closed the store.
    if (Number.isNaN(reopen.getTime())) return true;
    return new Date() < reopen;
  } catch (err) {
    console.error('[store-status] unexpected error:', err);
    return false;
  }
}
