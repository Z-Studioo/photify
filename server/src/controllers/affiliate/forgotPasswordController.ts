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

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('Failed to generate affiliate password reset link:', linkErr);
      res.status(200).json(GENERIC_SUCCESS);
      return;
    }

    await sendAffiliatePasswordResetEmail({
      name: affiliate.name,
      email: affiliate.email,
      reset_link: linkData.properties.action_link,
    });

    res.status(200).json(GENERIC_SUCCESS);
  } catch (err) {
    console.error('Affiliate forgot-password error:', err);
    res.status(200).json(GENERIC_SUCCESS);
  }
}
