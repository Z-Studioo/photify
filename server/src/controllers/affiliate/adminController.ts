import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import {
  sendAffiliateApprovedEmail,
  sendAffiliateRejectedEmail,
  sendAffiliatePayoutSentEmail,
  sendAffiliateCommissionApprovedEmail,
  sendAffiliateNewSaleEmail,
} from '@/lib/sendgrid';

const DEFAULT_BATCH_LIMIT = 200;
const APPROVAL_DEBOUNCE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/affiliates  (admin)
 * Optional ?status=pending|approved|rejected|disabled
 */
export async function listAffiliates(req: Request, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  let query = supabase
    .from('affiliates')
    .select(
      'id, name, email, code, status, commission_rate, customer_discount_pct, applied_at, approved_at, created_at'
    )
    .order('status', { ascending: true })
    .order('applied_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ data });
}

/**
 * GET /api/affiliates/:id  (admin)
 */
export async function getAffiliate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  const { data: stats } = await supabase.rpc('get_affiliate_stats', {
    p_affiliate_id: id,
  });

  const { data: recentCommissions } = await supabase
    .from('affiliate_commissions')
    .select('id, order_id, commission_amount, status, created_at, approved_at, paid_at')
    .eq('affiliate_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: payouts } = await supabase
    .from('affiliate_payouts')
    .select('id, amount, method, reference, note, paid_at')
    .eq('affiliate_id', id)
    .order('paid_at', { ascending: false });

  res.status(200).json({
    data: {
      affiliate,
      stats: Array.isArray(stats) ? stats[0] ?? null : stats ?? null,
      recent_commissions: recentCommissions ?? [],
      payouts: payouts ?? [],
    },
  });
}

function buildCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12);
  return base || `AFF${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Referral codes must be unique on both `affiliates.code` and `promotions.code`.
 * Orphan promotions (left from a failed approve) can be reused for the same affiliate.
 */
async function isReferralCodeTaken(code: string, excludeAffiliateId?: string): Promise<boolean> {
  const { data: aff } = await supabase
    .from('affiliates')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (aff && aff.id !== excludeAffiliateId) return true;

  const { data: promo } = await supabase
    .from('promotions')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (!promo) return false;

  const { data: linkedAffs } = await supabase
    .from('affiliates')
    .select('id')
    .eq('promotion_id', promo.id);

  return (linkedAffs ?? []).some((row) => row.id !== excludeAffiliateId);
}

async function ensureUniqueCode(seed: string, excludeAffiliateId?: string): Promise<string> {
  let candidate = seed;
  for (let i = 0; i < 10; i++) {
    if (!(await isReferralCodeTaken(candidate, excludeAffiliateId))) return candidate;
    candidate = `${seed}${Math.floor(Math.random() * 1000)}`;
  }
  return `${seed}${Date.now().toString().slice(-4)}`;
}

async function mintAffiliatePromotion(
  code: string,
  affiliate: { id: string; name: string },
  customerDiscount: number
): Promise<{ id: string } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const farFuture = '2099-12-31';
  const value = Number((customerDiscount * 100).toFixed(2));
  const payload = {
    description: `Affiliate discount for ${affiliate.name}`,
    type: 'percentage' as const,
    value,
    min_order: 0,
    is_active: true,
    start_date: today,
    end_date: farFuture,
    categories: ['all'],
    first_order_only: false,
  };

  const { data: existingPromo } = await supabase
    .from('promotions')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existingPromo) {
    const { data: otherAff } = await supabase
      .from('affiliates')
      .select('id')
      .eq('promotion_id', existingPromo.id)
      .neq('id', affiliate.id)
      .maybeSingle();
    if (otherAff) return null;

    const { data: updated, error } = await supabase
      .from('promotions')
      .update(payload)
      .eq('id', existingPromo.id)
      .select('id')
      .single();
    if (error || !updated) {
      console.error('Failed to refresh orphan affiliate promotion:', error);
      return null;
    }
    return { id: updated.id };
  }

  const { data: created, error } = await supabase
    .from('promotions')
    .insert({ code, ...payload })
    .select('id')
    .single();
  if (error || !created) {
    console.error('Failed to create promotion for affiliate:', error);
    return null;
  }
  return { id: created.id };
}

/** Supabase invite errors vary in wording ("already registered", "already been registered", etc.). */
function isInviteEmailAlreadyRegistered(message: string): boolean {
  return /already.*registered/i.test(message) || /email.*already/i.test(message);
}

async function findAuthUserByEmail(email: string) {
  const normalized = email.toLowerCase();
  const perPage = 1000;
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) return { user: null, error };
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return { user: match, error: null };
    if (data.users.length < perPage) break;
    page += 1;
  }

  return { user: null, error: null };
}

async function linkAuthUserToAffiliate(
  userId: string,
  affiliateId: string,
  name: string,
  existingMetadata: Record<string, unknown> | undefined
): Promise<void> {
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(existingMetadata || {}),
      role: 'affiliate',
      affiliate_id: affiliateId,
      name,
    },
  });
  await supabase.from('affiliates').update({ user_id: userId }).eq('id', affiliateId);
}

/**
 * POST /api/affiliates/:id/approve
 *
 * Body (optional):
 *   { commission_rate?, customer_discount_pct?, code? }
 *
 * Steps:
 *   1. Generate unique code (or use provided).
 *   2. Create matching `promotions` row (percentage, value = discount%).
 *   3. Issue Supabase magic-link invite for the affiliate's email.
 *   4. Stamp affiliate role + link user_id once invite is accepted (we set role
 *      in user_metadata at invite time so the first session is already roled).
 *   5. Flip affiliate row to status=approved.
 *   6. Fire approval email with the magic-link URL.
 */
export async function approveAffiliate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const adminId = (req as any).user?.id as string | undefined;

  const overrides = (req.body || {}) as {
    commission_rate?: number;
    customer_discount_pct?: number;
    code?: string;
  };

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  if (affiliate.status === 'approved') {
    res.status(400).json({ error: 'Affiliate is already approved' });
    return;
  }

  const commissionRate = overrides.commission_rate ?? affiliate.commission_rate;
  const customerDiscount = overrides.customer_discount_pct ?? affiliate.customer_discount_pct;
  const rawCode = overrides.code?.toUpperCase().replace(/[^A-Z0-9]+/g, '') || buildCode(affiliate.name);
  const code = await ensureUniqueCode(rawCode, affiliate.id);

  const promo = await mintAffiliatePromotion(code, affiliate, Number(customerDiscount));
  if (!promo) {
    res.status(500).json({ error: 'Failed to mint affiliate promo code' });
    return;
  }

  const redirectTo = `${config.CLIENT_URL || 'https://photify.co'}/affiliate/set-password`;

  const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    affiliate.email,
    {
      redirectTo,
      data: { role: 'affiliate', affiliate_id: affiliate.id, name: affiliate.name },
    }
  );

  if (inviteErr) {
    if (!isInviteEmailAlreadyRegistered(inviteErr.message)) {
      console.error('Failed to invite affiliate user:', inviteErr);
      res.status(500).json({ error: 'Failed to send affiliate invite' });
      return;
    }

    const { user: existingUser, error: lookupErr } = await findAuthUserByEmail(affiliate.email);
    if (lookupErr) {
      console.error('Failed to look up existing auth user:', lookupErr);
      res.status(500).json({ error: 'Failed to link affiliate account' });
      return;
    }
    if (!existingUser) {
      res.status(500).json({
        error:
          'This email is already registered but could not be linked. Try a different email or contact support.',
      });
      return;
    }

    const existingRole = (existingUser.user_metadata as Record<string, unknown> | undefined)?.role;
    if (existingRole === 'admin') {
      res.status(409).json({
        error: 'Email in use',
        message:
          'This email belongs to an admin account. Approve with a different email, or use a separate affiliate login.',
      });
      return;
    }

    await linkAuthUserToAffiliate(
      existingUser.id,
      affiliate.id,
      affiliate.name,
      existingUser.user_metadata as Record<string, unknown> | undefined
    );
  } else if (inviteData?.user) {
    await linkAuthUserToAffiliate(
      inviteData.user.id,
      affiliate.id,
      affiliate.name,
      inviteData.user.user_metadata as Record<string, unknown> | undefined
    );
  }

  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: affiliate.email,
    options: { redirectTo },
  });

  const magicLink = linkData?.properties?.action_link || `${config.CLIENT_URL || 'https://photify.co'}/affiliate/login`;

  const { error: updateErr } = await supabase
    .from('affiliates')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      rejected_at: null,
      rejection_reason: null,
      disabled_at: null,
      code,
      promotion_id: promo.id,
      commission_rate: commissionRate,
      customer_discount_pct: customerDiscount,
      admin_notes: affiliate.admin_notes ?? null,
    })
    .eq('id', id);

  if (updateErr) {
    console.error('Failed to update affiliate to approved:', updateErr);
    res.status(500).json({ error: 'Failed to approve affiliate' });
    return;
  }

  await sendAffiliateApprovedEmail({
    name: affiliate.name,
    email: affiliate.email,
    code,
    customer_discount_pct: customerDiscount,
    commission_rate: commissionRate,
    magic_link: magicLink,
  });

  res.status(200).json({
    success: true,
    data: { id, code, promotion_id: promo.id, approved_by: adminId },
  });
}

/**
 * POST /api/affiliates/:id/reject
 * Body: { reason?: string }
 */
export async function rejectAffiliate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : null;

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id, name, email, status')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  if (affiliate.status === 'approved') {
    res.status(400).json({ error: 'Cannot reject an already approved affiliate. Disable instead.' });
    return;
  }

  const { error: updErr } = await supabase
    .from('affiliates')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', id);

  if (updErr) {
    res.status(500).json({ error: updErr.message });
    return;
  }

  await sendAffiliateRejectedEmail({ name: affiliate.name, email: affiliate.email, reason });

  res.status(200).json({ success: true });
}

/**
 * POST /api/affiliates/:id/disable
 * Also deactivates the linked promotion code.
 */
export async function disableAffiliate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id, promotion_id, status')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  const { error: updErr } = await supabase
    .from('affiliates')
    .update({ status: 'disabled', disabled_at: new Date().toISOString() })
    .eq('id', id);

  if (updErr) {
    res.status(500).json({ error: updErr.message });
    return;
  }

  if (affiliate.promotion_id) {
    await supabase.from('promotions').update({ is_active: false }).eq('id', affiliate.promotion_id);
  }

  res.status(200).json({ success: true });
}

/**
 * POST /api/affiliates/:id/enable
 * Re-activates a previously approved affiliate (restores referral + promo).
 */
export async function enableAffiliate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id, promotion_id, status, code')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  if (affiliate.status !== 'disabled') {
    res.status(400).json({ error: 'Only disabled affiliates can be re-enabled' });
    return;
  }

  if (!affiliate.code || !affiliate.promotion_id) {
    res.status(400).json({
      error: 'Cannot re-enable',
      message: 'This affiliate was never fully approved. Use Approve instead.',
    });
    return;
  }

  const { error: updErr } = await supabase
    .from('affiliates')
    .update({ status: 'approved', disabled_at: null })
    .eq('id', id);

  if (updErr) {
    res.status(500).json({ error: updErr.message });
    return;
  }

  await supabase.from('promotions').update({ is_active: true }).eq('id', affiliate.promotion_id);

  res.status(200).json({ success: true });
}

/**
 * POST /api/affiliates/:id/payouts
 * Body: { amount?: number, method?: string, reference?: string, note?: string }
 *
 * If `amount` is omitted, pays out the full approved balance.
 * Marks all matching approved commissions (oldest first up to amount) as `paid`.
 */
export async function recordAffiliatePayout(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const adminId = (req as any).user?.id as string | undefined;
  const { amount, method, reference, note } = (req.body || {}) as {
    amount?: number;
    method?: string;
    reference?: string;
    note?: string;
  };

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle();

  if (error || !affiliate) {
    res.status(404).json({ error: 'Affiliate not found' });
    return;
  }

  const { data: approved } = await supabase
    .from('affiliate_commissions')
    .select('id, commission_amount')
    .eq('affiliate_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (!approved?.length) {
    res.status(400).json({ error: 'No approved commissions to pay out' });
    return;
  }

  const targetAmount = typeof amount === 'number' && amount > 0
    ? amount
    : approved.reduce((sum, c) => sum + Number(c.commission_amount), 0);

  let runningTotal = 0;
  const toPay: string[] = [];
  for (const c of approved) {
    if (runningTotal >= targetAmount) break;
    toPay.push(c.id);
    runningTotal += Number(c.commission_amount);
  }

  if (toPay.length === 0) {
    res.status(400).json({ error: 'Amount too small to cover any commission' });
    return;
  }

  const paidAt = new Date().toISOString();

  const { data: payout, error: payoutErr } = await supabase
    .from('affiliate_payouts')
    .insert({
      affiliate_id: id,
      amount: runningTotal,
      method: method || null,
      reference: reference || null,
      note: note || null,
      paid_at: paidAt,
      created_by: adminId || null,
    })
    .select('id, amount, paid_at, method, reference')
    .single();

  if (payoutErr || !payout) {
    res.status(500).json({ error: payoutErr?.message || 'Failed to record payout' });
    return;
  }

  const { error: markErr } = await supabase
    .from('affiliate_commissions')
    .update({ status: 'paid', payout_id: payout.id, paid_at: paidAt })
    .in('id', toPay);

  if (markErr) {
    console.error('Failed to mark commissions paid:', markErr);
  }

  await sendAffiliatePayoutSentEmail({
    name: affiliate.name,
    email: affiliate.email,
    amount: `£${runningTotal.toFixed(2)}`,
    method: method || null,
    reference: reference || null,
    paid_at: new Date(paidAt).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  });

  res.status(200).json({
    success: true,
    data: { payout, commissions_paid: toPay.length, amount: runningTotal },
  });
}

/**
 * POST /api/affiliates/admin/run-commission-approval
 *
 * Idempotent, debounced. Flips eligible pending commissions to approved using
 * a single set-based UPDATE in `approve_due_commissions` RPC, then emails the
 * affected affiliates.
 */
export async function runCommissionApproval(_req: Request, res: Response): Promise<void> {
  const { data: jobRow } = await supabase
    .from('system_jobs')
    .select('last_run_at')
    .eq('job_name', 'affiliate_commission_approval')
    .maybeSingle();

  if (jobRow?.last_run_at) {
    const lastRun = new Date(jobRow.last_run_at).getTime();
    if (Date.now() - lastRun < APPROVAL_DEBOUNCE_MS) {
      res.status(200).json({ skipped: true, reason: 'debounced' });
      return;
    }
  }

  const { data: approved, error } = await supabase.rpc('approve_due_commissions', {
    p_batch_limit: DEFAULT_BATCH_LIMIT,
  });

  if (error) {
    await supabase
      .from('system_jobs')
      .upsert({ job_name: 'affiliate_commission_approval', last_run_at: new Date().toISOString(), last_status: 'error', last_message: error.message });
    res.status(500).json({ error: error.message });
    return;
  }

  await supabase
    .from('system_jobs')
    .upsert({
      job_name: 'affiliate_commission_approval',
      last_run_at: new Date().toISOString(),
      last_status: 'ok',
      last_message: `approved ${approved?.length || 0}`,
    });

  if (approved && approved.length > 0) {
    const affIds = Array.from(new Set(approved.map((r: any) => r.affiliate_id)));
    const orderIds = Array.from(new Set(approved.map((r: any) => r.order_id)));

    const [{ data: affs }, { data: orders }] = await Promise.all([
      supabase.from('affiliates').select('id, name, email').in('id', affIds as string[]),
      supabase.from('orders').select('id, order_number').in('id', orderIds as string[]),
    ]);

    const affMap = new Map((affs || []).map((a: any) => [a.id, a]));
    const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));

    for (const row of approved as Array<{ affiliate_id: string; order_id: string; commission_amount: number }>) {
      const aff = affMap.get(row.affiliate_id);
      const ord = orderMap.get(row.order_id);
      if (!aff || !ord) continue;
      await sendAffiliateCommissionApprovedEmail({
        name: (aff as any).name,
        email: (aff as any).email,
        order_number: (ord as any).order_number,
        commission_amount: `£${Number(row.commission_amount).toFixed(2)}`,
      });
    }
  }

  res.status(200).json({
    success: true,
    approved_count: approved?.length || 0,
  });
}

/**
 * Internal helper used by Stripe webhook to email an affiliate when a new
 * commission row is created. Kept here so all SendGrid surface for affiliates
 * lives in one place.
 */
export async function notifyAffiliateOfNewSale(
  affiliateId: string,
  orderId: string,
  commissionAmount: number
): Promise<void> {
  const [{ data: aff }, { data: order }] = await Promise.all([
    supabase
      .from('affiliates')
      .select('name, email')
      .eq('id', affiliateId)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('order_number, total')
      .eq('id', orderId)
      .maybeSingle(),
  ]);

  if (!aff || !order) return;

  await sendAffiliateNewSaleEmail({
    name: aff.name,
    email: aff.email,
    order_number: order.order_number,
    commission_amount: `£${commissionAmount.toFixed(2)}`,
    order_total: `£${Number(order.total).toFixed(2)}`,
  });
}
