-- Test Search Similarity
-- This tests what similarity scores you're actually getting
-- Run this in Supabase SQL Editor

-- First, let's see what products have embeddings
SELECT 
    id,
    name,
    CASE 
        WHEN name_embedding IS NOT NULL THEN '✅ Has embedding'
        ELSE '❌ No embedding'
    END as embedding_status
FROM products
WHERE active = true
LIMIT 10;

-- Now test similarity with a product that has an embedding
-- This simulates searching for a product by using its own embedding
-- (similarity should be 1.0 - perfect match)
WITH test_product AS (
    SELECT 
        id,
        name,
        name_embedding
    FROM products
    WHERE name_embedding IS NOT NULL
    LIMIT 1
)
SELECT 
    p.id,
    p.name,
    1 - (p.name_embedding <=> tp.name_embedding) as similarity,
    CASE 
        WHEN 1 - (p.name_embedding <=> tp.name_embedding) > 0.65 THEN '✅ Above threshold (0.65)'
        ELSE '❌ Below threshold'
    END as threshold_status
FROM products p, test_product tp
WHERE p.name_embedding IS NOT NULL
ORDER BY p.name_embedding <=> tp.name_embedding
LIMIT 10;

-- Check function signature
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'search_products_semantic';

