-- Verify Semantic Search Setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if pgvector extension is installed
SELECT 
    extname, 
    extversion 
FROM pg_extension 
WHERE extname = 'vector';
-- Expected: 1 row with name 'vector'

-- 2. Check if name_embedding column exists
SELECT 
    column_name,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'name_embedding';
-- Expected: 1 row showing 'vector' type

-- 3. Check if any products have embeddings
SELECT 
    COUNT(*) as total_products,
    COUNT(name_embedding) as products_with_embeddings,
    COUNT(*) - COUNT(name_embedding) as products_without_embeddings
FROM products
WHERE active = true;
-- Expected: products_with_embeddings should be > 0

-- 4. Check if search function exists
SELECT 
    proname as function_name,
    pronargs as num_args
FROM pg_proc 
WHERE proname = 'search_products_semantic';
-- Expected: 1 row showing the function exists

-- 5. Test the search function with a dummy vector
-- This tests if the function works at all
SELECT 
    id,
    name,
    similarity
FROM search_products_semantic(
    (SELECT name_embedding FROM products WHERE name_embedding IS NOT NULL LIMIT 1),
    0.5,
    5
);
-- Expected: Should return products with similarity scores

-- 6. Check RLS policies on products
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'products';
-- Shows all RLS policies

