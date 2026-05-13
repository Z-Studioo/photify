import { Router } from 'express';
import {
  createPaymentIntent,
  updatePaymentIntent,
} from '@/controllers/paymentIntentController';

const router = Router();

/**
 * @swagger
 * /api/payment-intent:
 *   post:
 *     summary: Create a PaymentIntent for inline/Express Checkout payment flows
 *     description: |
 *       Creates a pending order in Supabase and a Stripe PaymentIntent so the
 *       frontend can confirm the payment inline with Stripe Elements (Payment
 *       Element or Express Checkout Element — Apple Pay, Google Pay, Link).
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: PaymentIntent created
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/', createPaymentIntent);

/**
 * @swagger
 * /api/payment-intent/{id}:
 *   patch:
 *     summary: Update an existing PaymentIntent (amount/shipping)
 *     tags: [Checkout]
 */
router.patch('/:id', updatePaymentIntent);

export default router;
