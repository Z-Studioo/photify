import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import { sendAffiliateAppliedEmail } from '@/lib/sendgrid';
import sgMail from '@sendgrid/mail';

export const applyValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 255 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isString().isLength({ max: 50 }),
  body('website').optional({ checkFalsy: true }).isURL(),
  body('social_handle').optional({ checkFalsy: true }).isString().isLength({ max: 255 }),
  body('audience_description').optional({ checkFalsy: true }).isString().isLength({ max: 2000 }),
];

/**
 * POST /api/affiliates/apply
 *
 * Public endpoint. Creates a new `affiliates` row with status=`pending`.
 * Fires confirmation email to the applicant and a notification to admin.
 * Idempotent on email: a second submission for an already-pending email
 * just refreshes the record.
 */
export async function applyAsAffiliate(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Invalid input', details: errors.array() });
    return;
  }

  const { name, email, phone, website, social_handle, audience_description } = req.body as {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    social_handle?: string;
    audience_description?: string;
  };

  try {
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing && existing.status === 'approved') {
      res.status(409).json({
        error: 'Already an affiliate',
        message: 'You already have an approved affiliate account. Please log in.',
      });
      return;
    }

    if (existing && existing.status === 'disabled') {
      res.status(403).json({
        error: 'Account disabled',
        message: 'This affiliate account has been disabled. Please contact support.',
      });
      return;
    }

    const payload = {
      name,
      email,
      phone: phone || null,
      website: website || null,
      social_handle: social_handle || null,
      audience_description: audience_description || null,
      status: 'pending' as const,
      applied_at: new Date().toISOString(),
    };

    const upsert = existing
      ? await supabase
          .from('affiliates')
          .update({ ...payload, rejected_at: null, rejection_reason: null })
          .eq('id', existing.id)
          .select('id, name, email')
          .single()
      : await supabase
          .from('affiliates')
          .insert(payload)
          .select('id, name, email')
          .single();

    if (upsert.error || !upsert.data) {
      console.error('Failed to create affiliate application:', upsert.error);
      res.status(500).json({ error: 'Failed to submit application' });
      return;
    }

    await sendAffiliateAppliedEmail({ name: upsert.data.name, email: upsert.data.email });

    if (config.SENDGRID_API_KEY && config.ADMIN_EMAIL) {
      try {
        await sgMail.send({
          to: config.ADMIN_EMAIL,
          from: config.SENDGRID_FROM_EMAIL || 'noreply@photify.co',
          subject: `New affiliate application: ${upsert.data.name}`,
          html: `
            <h2>New affiliate application</h2>
            <p><strong>Name:</strong> ${upsert.data.name}</p>
            <p><strong>Email:</strong> ${upsert.data.email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${website ? `<p><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ''}
            ${social_handle ? `<p><strong>Social handle:</strong> ${social_handle}</p>` : ''}
            ${audience_description ? `<p><strong>Audience:</strong><br/>${audience_description}</p>` : ''}
            <p>
              <a href="${config.CLIENT_URL || 'https://photify.co'}/admin/affiliates/${upsert.data.id}">
                Review application
              </a>
            </p>
          `,
        });
      } catch (err) {
        console.error('Failed to notify admin of affiliate application:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted. We will email you once it has been reviewed.',
    });
  } catch (err) {
    console.error('Affiliate apply error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
}

/**
 * POST /api/affiliates/track-click
 * Public endpoint; fire-and-forget aggregate increment. Body: { code }.
 */
export async function trackAffiliateClick(req: Request, res: Response): Promise<void> {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!code) {
    res.status(204).end();
    return;
  }

  try {
    await supabase.rpc('increment_affiliate_click', { p_code: code });
  } catch (err) {
    console.error('Failed to track affiliate click:', err);
  }
  res.status(204).end();
}
