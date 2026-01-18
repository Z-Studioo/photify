import { Router } from 'express';
import { createCheckoutSession } from '@/controllers/checkoutController';

const router = Router();

/**
 * POST /api/checkout
 * Create Stripe checkout session and order
 */
router.post('/', createCheckoutSession);

export default router;
