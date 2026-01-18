import { Router } from 'express';
import { generateProductEmbeddings } from '@/controllers/embeddingsController';

const router = Router();

/**
 * POST /api/embeddings/generate
 * Generate embeddings for products
 */
router.post('/generate', generateProductEmbeddings);

export default router;
