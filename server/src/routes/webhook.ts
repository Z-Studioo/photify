import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '@/controllers/webhookController';

const router = Router();

/**
 * POST /api/webhook
 * Handle Stripe webhook events
 * Note: This route needs raw body, so we use express.raw() middleware
 */
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
