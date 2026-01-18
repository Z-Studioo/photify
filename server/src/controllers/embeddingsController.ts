import { Request, Response } from 'express';
import { generateEmbedding } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

interface GenerateEmbeddingRequestBody {
  productId?: string;
  productIds?: string[];
  bulkUpdate?: boolean;
}

/**
 * POST /api/embeddings/generate
 * Generate embedding for a single product or bulk products
 */
export async function generateProductEmbeddings(
  req: Request<{}, {}, GenerateEmbeddingRequestBody>,
  res: Response
): Promise<void> {
  try {
    const { productId, productIds, bulkUpdate } = req.body;

    // Single product update
    if (productId) {
      // Fetch product data with categories through junction table
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          description,
          product_categories(
            categories(name)
          )
        `)
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Generate search text: product name + all category names
      const categories = (product.product_categories as any[]) || [];
      const categoryNames = categories
        .map((pc: any) => pc.categories?.name)
        .filter(Boolean)
        .join(' ');
      const searchText = `${product.name} ${categoryNames}`.trim();

      // Generate embedding
      const embedding = await generateEmbedding(searchText);

      // Update product with embedding
      const { error: updateError } = await supabase
        .from('products')
        .update({ name_embedding: embedding })
        .eq('id', productId);

      if (updateError) {
        throw updateError;
      }

      res.status(200).json({
        success: true,
        productId,
        searchText,
        embeddingDimensions: embedding.length,
      });
      return;
    }

    // Bulk update for multiple products
    if (productIds && Array.isArray(productIds)) {
      const results = [];
      const errors = [];

      for (const id of productIds) {
        try {
          // Fetch product
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select(`
              id, 
              name, 
              description,
              product_categories(
                categories(name)
              )
            `)
            .eq('id', id)
            .single();

          if (fetchError || !product) {
            errors.push({ id, error: 'Product not found' });
            continue;
          }

          // Generate search text
          const categories = (product.product_categories as any[]) || [];
          const categoryNames = categories
            .map((pc: any) => pc.categories?.name)
            .filter(Boolean)
            .join(' ');
          const searchText = `${product.name} ${categoryNames}`.trim();

          // Generate embedding
          const embedding = await generateEmbedding(searchText);

          // Update product
          const { error: updateError } = await supabase
            .from('products')
            .update({ name_embedding: embedding })
            .eq('id', id);

          if (updateError) {
            errors.push({ id, error: updateError.message });
          } else {
            results.push({ id, success: true });
          }
        } catch (err) {
          errors.push({ id, error: 'Failed to process' });
        }
      }

      res.status(200).json({
        success: true,
        processed: results.length,
        errorCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
      return;
    }

    // Bulk update ALL products
    if (bulkUpdate === true) {
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          description,
          product_categories(
            categories(name)
          )
        `)
        .eq('active', true);

      if (fetchError || !products) {
        res.status(500).json({ error: 'Failed to fetch products' });
        return;
      }

      const results = [];
      const errors = [];

      for (const product of products) {
        try {
          // Generate search text
          const categories = (product.product_categories as any[]) || [];
          const categoryNames = categories
            .map((pc: any) => pc.categories?.name)
            .filter(Boolean)
            .join(' ');
          const searchText = `${product.name} ${categoryNames}`.trim();

          // Generate embedding
          const embedding = await generateEmbedding(searchText);

          // Update product
          const { error: updateError } = await supabase
            .from('products')
            .update({ name_embedding: embedding })
            .eq('id', product.id);

          if (updateError) {
            errors.push({ id: product.id, error: updateError.message });
          } else {
            results.push({ id: product.id, success: true, searchText });
          }

          // Rate limiting: wait 50ms between requests
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (err) {
          errors.push({
            id: product.id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      res.status(200).json({
        success: true,
        total: products.length,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
      return;
    }

    res.status(400).json({ error: 'Missing required parameters' });
  } catch (error) {
    console.error('Error in embeddings generation:', error);
    res.status(500).json({
      error: 'Failed to generate embeddings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
