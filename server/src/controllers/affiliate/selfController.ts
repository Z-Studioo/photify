import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import type { AffiliateRecord } from '@/middleware/affiliateAuth';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function getAffiliate(req: Request): AffiliateRecord {
  return (req as any).affiliate as AffiliateRecord;
}

/**
 * GET /api/affiliates/me
 */
export async function getMyAffiliate(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  res.status(200).json({ data: aff });
}

/**
 * PATCH /api/affiliates/me
 * Allowed fields: name, payout_method, payout_details
 */
export async function updateMyAffiliate(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  const { name, payout_method, payout_details } = req.body as {
    name?: string;
    payout_method?: string;
    payout_details?: Record<string, unknown>;
  };

  const update: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim().length > 1) update.name = name.trim();
  if (typeof payout_method === 'string') update.payout_method = payout_method;
  if (payout_details && typeof payout_details === 'object') update.payout_details = payout_details;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'No updatable fields supplied' });
    return;
  }

  const { error } = await supabase.from('affiliates').update(update).eq('id', aff.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ success: true });
}

/**
 * GET /api/affiliates/me/stats
 */
export async function getMyStats(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  const { data, error } = await supabase.rpc('get_affiliate_stats', { p_affiliate_id: aff.id });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ data: Array.isArray(data) ? data[0] ?? null : data ?? null });
}

/**
 * GET /api/affiliates/me/commissions?status=&cursor=&limit=
 * Cursor format: ISO timestamp of `created_at` from the last row of the previous page.
 */
export async function getMyCommissions(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const limit = Math.min(
    Number(req.query.limit) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );

  let query = supabase
    .from('affiliate_commissions')
    .select(
      'id, order_id, commission_base, commission_amount, rate, status, available_at, approved_at, paid_at, created_at, orders:order_id(order_number, total, created_at)'
    )
    .eq('affiliate_id', aff.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq('status', status);
  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const items = (data || []).slice(0, limit);
  const nextCursor = data && data.length > limit ? data[limit - 1]?.created_at : null;

  res.status(200).json({ data: items, next_cursor: nextCursor });
}

/**
 * GET /api/affiliates/me/payouts
 */
export async function getMyPayouts(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  const { data, error } = await supabase
    .from('affiliate_payouts')
    .select('id, amount, method, reference, note, paid_at')
    .eq('affiliate_id', aff.id)
    .order('paid_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ data });
}

/**
 * GET /api/affiliates/me/clicks?days=30
 */
export async function getMyClicks(req: Request, res: Response): Promise<void> {
  const aff = getAffiliate(req);
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('affiliate_referrals_daily')
    .select('day, click_count')
    .eq('affiliate_id', aff.id)
    .gte('day', sinceDate)
    .order('day', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ data });
}
