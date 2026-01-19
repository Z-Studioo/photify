-- ============================================
-- ART PRODUCTS DATA FIX SCRIPT
-- ============================================
-- Run this if the diagnostic script found issues
-- This script fixes common data problems
--
-- IMPORTANT: Review each section before running!
-- ============================================

BEGIN;

-- ============================================
-- FIX 1: Empty String UUIDs → NULL
-- ============================================
-- UUIDs cannot be empty strings, must be NULL or valid UUID

UPDATE art_products 
SET customization_product_id = NULL 
WHERE customization_product_id = ''::uuid;

UPDATE art_products 
SET aspect_ratio_id = NULL 
WHERE aspect_ratio_id = ''::uuid;

-- ============================================
-- FIX 2: Migrate old 'image' column to 'images' array
-- ============================================
-- If products still have old single image but no images array

UPDATE art_products 
SET images = ARRAY[image]::TEXT[]
WHERE image IS NOT NULL 
  AND image != ''
  AND (images IS NULL OR array_length(images, 1) = 0 OR array_length(images, 1) IS NULL);

-- ============================================
-- FIX 3: Set default status for NULL values
-- ============================================
-- All products should have a status (active, inactive, or draft)

UPDATE art_products 
SET status = 'active' 
WHERE status IS NULL;

-- ============================================
-- FIX 4: Ensure empty arrays are properly formatted
-- ============================================
-- JSONB arrays should be [] not null for consistency

UPDATE art_products 
SET meta_keywords = '[]'::jsonb
WHERE meta_keywords IS NULL;

UPDATE art_products 
SET features = '[]'::jsonb
WHERE features IS NULL;

UPDATE art_products 
SET specifications = '[]'::jsonb
WHERE specifications IS NULL;

UPDATE art_products 
SET available_sizes = '[]'::jsonb
WHERE available_sizes IS NULL;

-- ============================================
-- FIX 5: Set default values for new fields
-- ============================================

UPDATE art_products 
SET product_type = 'Canvas'
WHERE product_type IS NULL OR product_type = '';

UPDATE art_products 
SET allow_customization = false
WHERE allow_customization IS NULL;

UPDATE art_products 
SET stock_quantity = 50
WHERE stock_quantity = 0 OR stock_quantity IS NULL;

-- ============================================
-- FIX 6: Generate default SEO fields if missing
-- ============================================

UPDATE art_products 
SET meta_title = name || ' - Art Print'
WHERE meta_title IS NULL OR meta_title = '';

UPDATE art_products 
SET meta_description = COALESCE(
  SUBSTRING(description FROM 1 FOR 155), 
  'Beautiful ' || name || ' art print available in multiple sizes.'
)
WHERE meta_description IS NULL OR meta_description = '';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

\echo 'Verification: Check if fixes were applied'
\echo ''

SELECT 
    'Empty UUID fields' as check_type,
    COUNT(*) as count
FROM art_products 
WHERE customization_product_id = ''::uuid OR aspect_ratio_id = ''::uuid

UNION ALL

SELECT 
    'Products without images array' as check_type,
    COUNT(*) as count
FROM art_products 
WHERE image IS NOT NULL AND (images IS NULL OR array_length(images, 1) = 0)

UNION ALL

SELECT 
    'Products without status' as check_type,
    COUNT(*) as count
FROM art_products 
WHERE status IS NULL

UNION ALL

SELECT 
    'Products without meta_title' as check_type,
    COUNT(*) as count
FROM art_products 
WHERE meta_title IS NULL OR meta_title = ''

UNION ALL

SELECT 
    'Products without product_type' as check_type,
    COUNT(*) as count
FROM art_products 
WHERE product_type IS NULL OR product_type = '';

\echo ''
\echo 'All counts should be 0 after fixes'
\echo ''

-- ============================================
-- Sample of fixed data
-- ============================================

\echo 'Sample of fixed data (latest 3 products):'
SELECT 
    name,
    product_type,
    status,
    array_length(images, 1) as image_count,
    CASE WHEN meta_title IS NOT NULL THEN '✅' ELSE '❌' END as has_meta_title,
    CASE WHEN customization_product_id IS NULL THEN '✅ NULL' ELSE '✅ UUID' END as customization_status
FROM art_products
ORDER BY created_at DESC
LIMIT 3;

COMMIT;

\echo ''
\echo '============================================'
\echo 'DATA FIX COMPLETE'
\echo '============================================'
\echo 'Run the diagnostic script again to verify all issues are resolved.'

