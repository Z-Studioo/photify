-- Update Search Function Threshold
-- Run this in Supabase SQL Editor to update the default threshold to 0.1
-- This makes search more lenient and returns more results

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

