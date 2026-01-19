import { Router } from 'express';
import { searchSemantic, searchSemanticPost } from '@/controllers/searchController';

const router = Router();

/**
 * GET /api/search/semantic?q=query&limit=8&threshold=0.7
 * Perform semantic search using AI embeddings
 */
router.get('/semantic', searchSemantic);

/**
 * POST /api/search/semantic
 * Alternative endpoint for semantic search with filters
 */
router.post('/semantic', searchSemanticPost);

export default router;
