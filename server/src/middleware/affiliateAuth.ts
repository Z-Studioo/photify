import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';
import { supabase } from '@/lib/supabase';

export interface AffiliateRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  code: string | null;
  promotion_id: string | null;
  commission_rate: number;
  customer_discount_pct: number;
  holding_days: number;
  payout_min: number;
  payout_method: string | null;
  payout_details: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
}

/**
 * Affiliate authentication middleware.
 *
 * Validates the Supabase JWT, asserts `role = 'affiliate'`, and loads the
 * matching `affiliates` row into `req.affiliate`. Disabled / rejected /
 * pending affiliates are rejected.
 */
export async function affiliateAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization token is required',
    });
    return;
  }

  const token = authHeader.substring(7);

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
    console.error('Supabase configuration is missing');
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Authentication service is not properly configured',
    });
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    const role =
      (user.user_metadata as Record<string, unknown> | undefined)?.role ??
      (user.app_metadata as Record<string, unknown> | undefined)?.role;

    if (role !== 'affiliate') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Affiliate role required',
      });
      return;
    }

    const affiliateSelect =
      'id, user_id, name, email, code, promotion_id, commission_rate, customer_discount_pct, holding_days, payout_min, payout_method, payout_details, status';

    let { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select(affiliateSelect)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!affiliate && !affErr) {
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const affiliateId =
        typeof meta?.affiliate_id === 'string' ? meta.affiliate_id : undefined;

      if (affiliateId) {
        const { data: byMeta, error: metaErr } = await supabase
          .from('affiliates')
          .select(affiliateSelect)
          .eq('id', affiliateId)
          .maybeSingle();

        if (metaErr) affErr = metaErr;
        else if (byMeta) {
          affiliate = byMeta;
          if (!byMeta.user_id) {
            await supabase.from('affiliates').update({ user_id: user.id }).eq('id', byMeta.id);
            affiliate = { ...byMeta, user_id: user.id };
          }
        }
      }
    }

    if (!affiliate && !affErr && user.email) {
      const { data: byEmail, error: emailErr } = await supabase
        .from('affiliates')
        .select(affiliateSelect)
        .eq('email', user.email)
        .eq('status', 'approved')
        .maybeSingle();

      if (emailErr) affErr = emailErr;
      else if (byEmail) {
        affiliate = byEmail;
        await supabase.from('affiliates').update({ user_id: user.id }).eq('id', byEmail.id);
        affiliate = { ...byEmail, user_id: user.id };
      }
    }

    if (affErr) {
      console.error('Failed to load affiliate record:', affErr);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to resolve affiliate account',
      });
      return;
    }

    if (!affiliate) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'No affiliate account linked to this user',
      });
      return;
    }

    if (affiliate.status !== 'approved') {
      res.status(403).json({
        error: 'Forbidden',
        message: `Affiliate account is ${affiliate.status}`,
      });
      return;
    }

    (req as any).user = user;
    (req as any).affiliate = affiliate as AffiliateRecord;
    next();
  } catch (err) {
    console.error('Affiliate authentication error:', err);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}
