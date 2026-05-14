-- Migration: Products Semantic Search with Vector Embeddings
-- File: 024_products_semantic_search.sql
-- Description: Adds pgvector extension and embeddings column to products table for AI-powered semantic search
-- Date: 2025-10-30
-- Dependencies: 001_initial_schema.sql, 004_product_categories_many_to_many.sql

BEGIN;

-- ============================================
-- Enable pgvector extension for vector operations
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Add embeddings column to products table
-- ============================================
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_embedding vector(1536),
ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
  name || ' ' || COALESCE(description, '')
) STORED;

-- Add index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_products_name_embedding 
ON products USING ivfflat (name_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add GIN index for fast text search fallback
CREATE INDEX IF NOT EXISTS idx_products_search_text 
ON products USING gin(to_tsvector('english', search_text));

-- ============================================
-- Create function for semantic search
-- ============================================
CREATE OR REPLACE FUNCTION search_products_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  name varchar,
  slug varchar,
  description text,
  images text[],
  price decimal,
  is_featured boolean,
  category_name varchar,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.images,
    p.price,
    p.is_featured,
    (
      SELECT c.name 
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = p.id
      LIMIT 1
    ) as category_name,
    1 - (p.name_embedding <=> query_embedding) as similarity
  FROM products p
  WHERE 
    p.active = true
    AND p.name_embedding IS NOT NULL
    AND 1 - (p.name_embedding <=> query_embedding) > match_threshold
  ORDER BY p.name_embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- ============================================
-- Create function to generate search text for product
-- ============================================
CREATE OR REPLACE FUNCTION get_product_search_text(product_id uuid)
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT 
    p.name || ' ' || 
    COALESCE(p.description, '') || ' ' ||
    COALESCE(
      (
        SELECT string_agg(c.name, ' ')
        FROM categories c
        INNER JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = p.id
      ),
      ''
    )
  FROM products p
  WHERE p.id = product_id;
$$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN products.name_embedding IS 'Vector embedding of product name for semantic search (1536 dimensions)';
COMMENT ON COLUMN products.search_text IS 'Generated full-text search field combining name and description';
COMMENT ON FUNCTION search_products_semantic IS 'Semantic search using vector similarity (cosine distance)';
COMMENT ON FUNCTION get_product_search_text IS 'Get searchable text for a product including category name';

COMMIT;

