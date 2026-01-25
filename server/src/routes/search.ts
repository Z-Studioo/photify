import { Router } from 'express';
import { searchSemantic, searchSemanticPost } from '@/controllers/searchController';

const router = Router();

/**
 * @swagger
 * /api/search/semantic:
 *   get:
 *     summary: Perform semantic search using AI embeddings (GET)
 *     description: Search for products using natural language queries powered by OpenAI embeddings
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query in natural language
 *         example: modern abstract art
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Maximum number of results to return
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.7
 *         description: Minimum similarity threshold (0-1)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Missing or invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Search failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/semantic', searchSemantic);

/**
 * @swagger
 * /api/search/semantic:
 *   post:
 *     summary: Perform semantic search with filters (POST)
 *     description: Advanced semantic search endpoint with additional filtering options
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query in natural language
 *                 example: modern abstract art
 *               limit:
 *                 type: integer
 *                 default: 8
 *                 description: Maximum number of results
 *               threshold:
 *                 type: number
 *                 default: 0.7
 *                 description: Minimum similarity threshold (0-1)
 *               filters:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Filter by category name
 *                   minPrice:
 *                     type: number
 *                     description: Minimum price filter
 *                   maxPrice:
 *                     type: number
 *                     description: Maximum price filter
 *                   featured:
 *                     type: boolean
 *                     description: Filter by featured status
 *     responses:
 *       200:
 *         description: Search results with applied filters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *       400:
 *         description: Missing or invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Search failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/semantic', searchSemanticPost);

export default router;
