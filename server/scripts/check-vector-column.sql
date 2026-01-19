-- Check if name_embedding column exists in products table
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('name_embedding', 'search_text')
ORDER BY column_name;

-- If column exists, check if any embeddings are saved
-- Uncomment and run this if the column exists:
/*
SELECT 
    id,
    name,
    CASE 
        WHEN name_embedding IS NULL THEN 'NULL (not generated)'
        ELSE 'Has embedding (✓)'
    END as embedding_status
FROM products
LIMIT 5;
*/

