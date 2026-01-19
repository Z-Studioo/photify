-- Check products that need embedding regeneration
-- Run this to see which products need updating

-- View all products needing updates
SELECT * FROM v_products_need_embedding;

-- Count by status
SELECT 
  CASE 
    WHEN name_embedding IS NULL THEN 'Missing'
    WHEN embedding_needs_update THEN 'Stale'
    ELSE 'Up to date'
  END as status,
  COUNT(*) as count
FROM products
WHERE active = TRUE
GROUP BY status
ORDER BY status;

-- Manually mark specific products for regeneration
-- UPDATE products 
-- SET embedding_needs_update = TRUE, name_embedding = NULL
-- WHERE name LIKE '%Canvas%';

-- Manually mark ALL products for regeneration (use with caution!)
-- UPDATE products 
-- SET embedding_needs_update = TRUE, name_embedding = NULL
-- WHERE active = TRUE;

