import { Router } from 'express';
import { Request, Response } from 'express';
import checkoutRoutes from './checkout';
import contactRoutes from './contact';
import ordersRoutes from './orders';
import addressRoutes from './address';
import shippingRoutes from './shipping';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information endpoint
 *     description: Returns API version and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Photify API v1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 health:
 *                   type: string
 *                   example: /api/health
 *                 endpoints:
 *                   type: object
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Photify API v1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    endpoints: {
      checkout: 'POST /api/checkout',
      webhook: 'POST /api/webhook',
      contact: 'POST /api/contact',
      orderNotification: 'POST /api/orders/:orderNumber/status-notification',
      shippingQuotes: 'POST /api/shipping/orders/:orderNumber/quotes',
      shippingBook: 'POST /api/shipping/orders/:orderNumber/book',
      shippingLabel: 'GET /api/shipping/orders/:orderNumber/label',
      shippingTracking: 'GET /api/shipping/orders/:orderNumber/tracking',
      shippingSyncTracking:
        'POST /api/shipping/orders/:orderNumber/sync-tracking',
      parcel2goWebhook: 'POST /api/shipping/webhook',
    },
  });
});

// Mount route modules
// Note: Stripe webhook is mounted directly in app.ts before JSON body parser.
// The Parcel2Go webhook lives under /api/shipping/webhook (no admin auth —
// signature-verified). Admin-only shipping routes live alongside it.
router.use('/checkout', checkoutRoutes);
router.use('/contact', contactRoutes);
router.use('/orders', ordersRoutes);
router.use('/address', addressRoutes);
router.use('/shipping', shippingRoutes);

export default router;
