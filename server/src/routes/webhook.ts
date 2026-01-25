import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '@/controllers/webhookController';

const router = Router();

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Processes Stripe webhook events for payment confirmations and failures. Requires raw body parsing and signature verification.
 *     tags: [Webhook]
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload (raw body)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid signature or missing header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Webhook processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
