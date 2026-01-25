import { Router } from 'express';
import { generateProductEmbeddings } from '@/controllers/embeddingsController';

const router = Router();

/**
 * @swagger
 * /api/embeddings/generate:
 *   post:
 *     summary: Generate AI embeddings for products
 *     description: Generate OpenAI embeddings for product search functionality. Supports single product, multiple products, or bulk generation for all active products.
 *     tags: [Embeddings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmbeddingRequest'
 *           examples:
 *             singleProduct:
 *               summary: Generate embedding for a single product
 *               value:
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *             multipleProducts:
 *               summary: Generate embeddings for multiple products
 *               value:
 *                 productIds: ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174001"]
 *             bulkUpdate:
 *               summary: Generate embeddings for all active products
 *               value:
 *                 bulkUpdate: true
 *     responses:
 *       200:
 *         description: Embeddings generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmbeddingResponse'
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to generate embeddings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', generateProductEmbeddings);

export default router;
