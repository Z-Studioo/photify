import { Router } from 'express';
import { adminAuth } from '@/middleware/adminAuth';
import { affiliateAuth } from '@/middleware/affiliateAuth';
import {
  applyAsAffiliate,
  applyValidators,
  trackAffiliateClick,
} from '@/controllers/affiliate/applyController';
import {
  forgotPasswordValidators,
  requestAffiliatePasswordReset,
} from '@/controllers/affiliate/forgotPasswordController';
import {
  listAffiliates,
  getAffiliate,
  approveAffiliate,
  rejectAffiliate,
  disableAffiliate,
  enableAffiliate,
  recordAffiliatePayout,
  runCommissionApproval,
} from '@/controllers/affiliate/adminController';
import {
  getMyAffiliate,
  updateMyAffiliate,
  getMyStats,
  getMyCommissions,
  getMyPayouts,
  getMyClicks,
} from '@/controllers/affiliate/selfController';

const router = Router();

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/affiliates/apply:
 *   post:
 *     summary: Submit an affiliate application
 *     tags: [Affiliates]
 *     responses:
 *       201:
 *         description: Application submitted
 */
router.post('/apply', applyValidators, applyAsAffiliate);

/**
 * @swagger
 * /api/affiliates/track-click:
 *   post:
 *     summary: Fire-and-forget click tracker for /r/:code redirects
 *     tags: [Affiliates]
 *     responses:
 *       204:
 *         description: Click recorded
 */
router.post('/track-click', trackAffiliateClick);

/**
 * @swagger
 * /api/affiliates/forgot-password:
 *   post:
 *     summary: Request a password reset email (approved affiliates only)
 *     tags: [Affiliates]
 *     responses:
 *       200:
 *         description: Request accepted (same response whether or not the email exists)
 */
router.post('/forgot-password', forgotPasswordValidators, requestAffiliatePasswordReset);

// ---------------------------------------------------------------------------
// Affiliate-only (self service)
// ---------------------------------------------------------------------------

router.get('/me', affiliateAuth, getMyAffiliate);
router.patch('/me', affiliateAuth, updateMyAffiliate);
router.get('/me/stats', affiliateAuth, getMyStats);
router.get('/me/commissions', affiliateAuth, getMyCommissions);
router.get('/me/payouts', affiliateAuth, getMyPayouts);
router.get('/me/clicks', affiliateAuth, getMyClicks);

// ---------------------------------------------------------------------------
// Admin only
// ---------------------------------------------------------------------------

router.post('/admin/run-commission-approval', adminAuth, runCommissionApproval);
router.get('/', adminAuth, listAffiliates);
router.get('/:id', adminAuth, getAffiliate);
router.post('/:id/approve', adminAuth, approveAffiliate);
router.post('/:id/reject', adminAuth, rejectAffiliate);
router.post('/:id/disable', adminAuth, disableAffiliate);
router.post('/:id/enable', adminAuth, enableAffiliate);
router.post('/:id/payouts', adminAuth, recordAffiliatePayout);

export default router;
