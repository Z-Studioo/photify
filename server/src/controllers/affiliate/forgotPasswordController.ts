import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import { sendAffiliatePasswordResetEmail } from '@/lib/sendgrid';

export const forgotPasswordValidators = [
  body('email').isEmail().normalizeEmail(),
];

const GENERIC_SUCCESS = {
  success: true,
  message:
    'If an approved affiliate account exists for this email, you will receive password reset instructions shortly.',
};

function affiliateSetPasswordUrl(): string {
  return `${config.CLIENT_URL || 'http://localhost:5173'}/affiliate/set-password`;
}

/**
 * POST /api/affiliates/forgot-password
 *
 * Public. Sends a password-reset link via SendGrid (not Supabase Auth email).
 * Always returns the same success message to avoid email enumeration.
 */
export async function requestAffiliatePasswordReset(
  req: Request,
  res: Response
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  const { email } = req.body as { email: string };

  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, name, email, status')
      .eq('email', email)
      .maybeSingle();

    if (!affiliate || affiliate.status !== 'approved') {
      res.status(200).json(GENERIC_SUCCESS);
      return;
    }

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: affiliate.email,
      options: { redirectTo: affiliateSetPasswordUrl() },
    });

    const hashedToken = linkData?.properties?.hashed_token;
    if (linkErr || !hashedToken) {
      console.error('Failed to generate affiliate password reset link:', linkErr);
      res.status(200).json(GENERIC_SUCCESS);
      return;
    }

    // We deliberately email a URL into our own app rather than the Supabase
    // /auth/v1/verify action_link. The Supabase URL consumes the single-use
    // token on GET, which means email scanners (Outlook safe-links, Gmail
    // image proxies, corporate spam gateways) and chat link previewers
    // burn the token before the user can click it. Our URL only triggers
    // verifyOtp() in the browser via JS, which prefetchers cannot execute.
    const resetLink = `${affiliateSetPasswordUrl()}?token_hash=${encodeURIComponent(
      hashedToken
    )}&type=recovery`;

    await sendAffiliatePasswordResetEmail({
      name: affiliate.name,
      email: affiliate.email,
      reset_link: resetLink,
    });

    res.status(200).json(GENERIC_SUCCESS);
  } catch (err) {
    console.error('Affiliate forgot-password error:', err);
    res.status(200).json(GENERIC_SUCCESS);
  }
}
