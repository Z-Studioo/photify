import { Router } from 'express';
import { Request, Response } from 'express';
import checkoutRoutes from './checkout';
import webhookRoutes from './webhook';
import searchRoutes from './search';
import embeddingsRoutes from './embeddings';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Photify API v1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      checkout: 'POST /api/checkout',
      webhook: 'POST /api/webhook',
      search: 'GET /api/search/semantic',
      embeddings: 'POST /api/embeddings/generate',
    },
  });
});

// Mount route modules
router.use('/checkout', checkoutRoutes);
router.use('/webhook', webhookRoutes);
router.use('/search', searchRoutes);
router.use('/embeddings', embeddingsRoutes);

export default router;
