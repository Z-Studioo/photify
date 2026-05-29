import { supabase } from './supabase';

export interface ResolvedAffiliate {
  id: string;
  code: string;
}

/**
 * Resolve an affiliate referral code (case-insensitive) to the underlying
 * affiliate row. Returns null when the code is empty, unknown, or attached
 * to an account that is not currently `approved`.
 *
 * This is used at order-creation time to stamp `orders.affiliate_id` /
 * `orders.affiliate_code` so the Stripe webhook can later create the
 * matching `affiliate_commissions` row.
 */
export async function resolveAffiliateByCode(
  code: string | null | undefined
): Promise<ResolvedAffiliate | null> {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('affiliates')
    .select('id, code, status')
    .ilike('code', normalized)
    .maybeSingle();

  if (error) {
    console.error('Failed to resolve affiliate code:', error);
    return null;
  }
  if (!data || data.status !== 'approved') return null;
  return { id: data.id, code: data.code as string };
}
