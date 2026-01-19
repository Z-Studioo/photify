import { Request, Response } from 'express';
import { generateQueryEmbedding } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

interface SemanticSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  price: number;
  is_featured: boolean;
  category_name: string | null;
  similarity: number;
}

interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}

/**
 * GET /api/search/semantic?q=query&limit=8&threshold=0.7
 * Perform semantic search using AI embeddings
 */
export async function searchSemantic(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.q as string;
    const limit = parseInt((req.query.limit as string) || '8');
    const threshold = parseFloat((req.query.threshold as string) || '0.7');

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Generate embedding for search query
    const queryEmbedding = await generateQueryEmbedding(query);

    console.log('🔍 Semantic search query:', query);
    console.log('🎯 Using threshold:', threshold, 'limit:', limit);
    console.log('📊 Query embedding length:', queryEmbedding.length);

    // Perform semantic search using Supabase RPC
    const { data, error } = await supabase.rpc('search_products_semantic', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('❌ Semantic search RPC error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Search returned', data?.length || 0, 'results');

    // Transform results for frontend
    const results: SemanticSearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      images: item.images || [],
      price: parseFloat(item.price),
      is_featured: item.is_featured,
      category_name: item.category_name,
      similarity: parseFloat(item.similarity.toFixed(4)),
    }));

    res.status(200).json({
      success: true,
      query,
      results,
      count: results.length,
      threshold,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({
      error: 'Failed to perform semantic search',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/search/semantic
 * Alternative endpoint for semantic search (for more complex queries)
 */
export async function searchSemanticPost(req: Request, res: Response): Promise<void> {
  try {
    const { query, limit = 8, threshold = 0.7, filters = {} } = req.body;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Generate embedding for search query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Perform semantic search
    const { data, error } = await supabase.rpc('search_products_semantic', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('Semantic search error:', error);
      throw error;
    }

    let results: SemanticSearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      images: item.images || [],
      price: parseFloat(item.price),
      is_featured: item.is_featured,
      category_name: item.category_name,
      similarity: parseFloat(item.similarity.toFixed(4)),
    }));

    // Apply additional filters if provided
    const searchFilters = filters as SearchFilters;

    if (searchFilters.category) {
      results = results.filter(
        (r) =>
          r.category_name?.toLowerCase() === searchFilters.category!.toLowerCase()
      );
    }

    if (searchFilters.minPrice !== undefined) {
      results = results.filter((r) => r.price >= searchFilters.minPrice!);
    }

    if (searchFilters.maxPrice !== undefined) {
      results = results.filter((r) => r.price <= searchFilters.maxPrice!);
    }

    if (searchFilters.featured !== undefined) {
      results = results.filter((r) => r.is_featured === searchFilters.featured);
    }

    res.status(200).json({
      success: true,
      query,
      results,
      count: results.length,
      threshold,
      filters,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({
      error: 'Failed to perform semantic search',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
