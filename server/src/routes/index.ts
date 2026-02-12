import { Router } from 'express';
import { Request, Response } from 'express';
import checkoutRoutes from './checkout';
import searchRoutes from './search';
import embeddingsRoutes from './embeddings';
import contactRoutes from './contact';
import ordersRoutes from './orders';

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
      search: 'GET /api/search/semantic',
      embeddings: 'POST /api/embeddings/generate',
      contact: 'POST /api/contact',
      orderNotification: 'POST /api/orders/:orderNumber/status-notification',
    },
  });
});

// Mount route modules
// Note: Webhook route is mounted directly in app.ts before JSON body parser
router.use('/checkout', checkoutRoutes);
router.use('/search', searchRoutes);
router.use('/embeddings', embeddingsRoutes);
router.use('/contact', contactRoutes);
router.use('/orders', ordersRoutes);

export default router;
