import { Router } from 'express';
import { createCheckoutSession } from '@/controllers/checkoutController';

const router = Router();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create Stripe checkout session and order
 *     description: Creates a new order in Supabase and generates a Stripe checkout session for payment processing
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createCheckoutSession);

export default router;
