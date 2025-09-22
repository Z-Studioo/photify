import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API version info
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Photify API v1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

export default router;