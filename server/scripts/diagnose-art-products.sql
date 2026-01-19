-- ============================================
-- ART PRODUCTS DIAGNOSTIC SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to diagnose issues
-- with art_products table and related functionality
--
-- Purpose: Check if migration 016 is applied, verify RLS policies,
--          check data integrity, and test CRUD operations
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Review results to identify issues
-- 5. If issues found, run fix-art-products-data.sql
-- ============================================

-- ============================================
-- SECTION 1: TABLE STRUCTURE
-- ============================================
\echo '============================================'
\echo 'SECTION 1: TABLE STRUCTURE'
\echo '============================================'

-- Check if all new columns from migration 016 exist
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'art_products'
ORDER BY ordinal_position;

-- Expected columns (from migrations 016 & 017):
-- - images (text[])
-- - product_type (varchar)
-- - customization_product_id (uuid, nullable)
-- - allow_customization (boolean)
-- - meta_title, meta_description, meta_keywords
-- - features, specifications, trust_badges (jsonb)
-- - aspect_ratio_id (uuid, nullable)
-- - available_sizes (jsonb) - Format: [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}]
-- - stock_quantity (integer)
-- - status (varchar)

\echo ''
\echo 'CRITICAL CHECK: Do these columns exist?'
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'art_products' AND column_name = 'images') as has_images_array,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'art_products' AND column_name = 'product_type') as has_product_type,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'art_products' AND column_name = 'customization_product_id') as has_customization_link,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'art_products' AND column_name = 'status') as has_status,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'art_products' AND column_name = 'available_sizes') as has_available_sizes;

-- ============================================
-- SECTION 2: RLS POLICIES
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 2: RLS POLICIES'
\echo '============================================'

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'art_products'
ORDER BY policyname;

-- Expected policies:
-- 1. "Public read active art_products" - FOR SELECT - status = 'active' OR status IS NULL
-- 2. "Allow authenticated manage art_products" - FOR ALL - auth.role() = 'authenticated'

\echo ''
\echo 'CRITICAL CHECK: Do both policies exist?'
SELECT 
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'art_products' AND policyname ILIKE '%public%read%') as has_public_read_policy,
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'art_products' AND policyname ILIKE '%authenticated%manage%') as has_admin_write_policy;

-- ============================================
-- SECTION 3: DATA INTEGRITY
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 3: DATA INTEGRITY'
\echo '============================================'

-- Count records
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE status = 'active') as active_products,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_products,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_products,
    COUNT(*) FILTER (WHERE status IS NULL) as null_status_products
FROM art_products;

-- Check if old data needs migration (old 'image' column not migrated to 'images' array)
\echo ''
\echo 'Migration Check: Products with old image column but empty images array'
SELECT 
    id,
    name,
    image as old_single_image,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN array_length(images, 1) IS NULL THEN 'EMPTY ARRAY'
        ELSE 'HAS ' || array_length(images, 1)::text || ' IMAGES'
    END as images_status,
    CASE 
        WHEN image IS NOT NULL AND (images IS NULL OR array_length(images, 1) = 0 OR array_length(images, 1) IS NULL) 
        THEN '❌ NEEDS MIGRATION'
        ELSE '✅ OK'
    END as migration_status
FROM art_products
ORDER BY created_at DESC
LIMIT 10;

-- Check NULL vs empty values for UUID fields
\echo ''
\echo 'UUID Field Check: Customization and Aspect Ratio IDs'
SELECT 
    id,
    name,
    customization_product_id,
    aspect_ratio_id,
    CASE 
        WHEN customization_product_id IS NULL THEN '✅ NULL (good)'
        WHEN customization_product_id = '' THEN '❌ EMPTY STRING (bad)'
        ELSE '✅ HAS UUID'
    END as customization_status,
    CASE 
        WHEN aspect_ratio_id IS NULL THEN '✅ NULL (good)'
        WHEN aspect_ratio_id = '' THEN '❌ EMPTY STRING (bad)'
        ELSE '✅ HAS UUID'
    END as aspect_ratio_status
FROM art_products
LIMIT 5;

-- ============================================
-- SECTION 4: SAMPLE DATA
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 4: SAMPLE DATA (Latest 5 Products)'
\echo '============================================'

SELECT 
    id,
    name,
    slug,
    product_type,
    category,
    status,
    price,
    stock_quantity,
    is_bestseller,
    CASE 
        WHEN images IS NOT NULL THEN array_length(images, 1)
        ELSE 0
    END as image_count,
    CASE 
        WHEN available_sizes IS NOT NULL THEN jsonb_array_length(available_sizes)
        ELSE 0
    END as size_count,
    allow_customization,
    created_at
FROM art_products
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- SECTION 5: RELATED TABLES
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 5: RELATED TABLES'
\echo '============================================'

-- Check if aspect_ratios table exists and has data
\echo 'Aspect Ratios (for sizes):'
SELECT id, name, ratio_width, ratio_height 
FROM aspect_ratios 
ORDER BY ratio_width::float / ratio_height::float
LIMIT 5;

-- Check if sizes table exists and has data
\echo ''
\echo 'Sizes (for pricing):'
SELECT id, name, width, height, unit
FROM sizes 
ORDER BY width * height
LIMIT 10;

-- Check if products table exists (for customization links)
\echo ''
\echo 'Customizable Products (for linking):'
SELECT id, name, slug
FROM products
ORDER BY name
LIMIT 5;

-- ============================================
-- SECTION 6: TEST QUERIES
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 6: TEST QUERIES'
\echo '============================================'

-- Test public read (this should work for active products)
\echo 'Test 1: Public SELECT (should return active/null status only)'
SELECT id, name, status 
FROM art_products 
WHERE status = 'active' OR status IS NULL
LIMIT 3;

-- Test authenticated insert (this requires authentication)
\echo ''
\echo 'Test 2: Check if you can run authenticated queries'
\echo '(If you get an error, you are not authenticated)'
-- This will fail if not authenticated, which is expected
-- Run after admin login to test
SELECT auth.role() as current_role;

-- ============================================
-- SECTION 7: RECOMMENDED ACTIONS
-- ============================================
\echo ''
\echo '============================================'
\echo 'SECTION 7: RECOMMENDED ACTIONS'
\echo '============================================'
\echo ''
\echo 'Based on the results above, check:'
\echo ''
\echo '1. MIGRATION STATUS:'
\echo '   - If has_images_array = false → Run migration 016'
\echo '   - If migration_status shows "NEEDS MIGRATION" → Old data not migrated'
\echo ''
\echo '2. RLS POLICIES:'
\echo '   - If has_public_read_policy = false → Policy missing'
\echo '   - If has_admin_write_policy = false → Admin cannot edit'
\echo ''
\echo '3. UUID FIELDS:'
\echo '   - If you see "EMPTY STRING" → Database has invalid data'
\echo '   - Fix: UPDATE art_products SET customization_product_id = NULL WHERE customization_product_id = '''';'
\echo ''
\echo '4. AUTHENTICATION:'
\echo '   - If current_role is NULL → Not logged in to admin'
\echo '   - If current_role = ''anon'' → Not authenticated'
\echo '   - Should be ''authenticated'' for admin operations'
\echo ''

-- ============================================
-- QUICK FIX QUERIES (Run if needed)
-- ============================================
\echo ''
\echo '============================================'
\echo 'QUICK FIX QUERIES (Uncomment to run)'
\echo '============================================'

-- Fix empty string UUIDs (if found in section 3)
-- UPDATE art_products SET customization_product_id = NULL WHERE customization_product_id = '';
-- UPDATE art_products SET aspect_ratio_id = NULL WHERE aspect_ratio_id = '';

-- Migrate old image to images array (if products found in section 3)
-- UPDATE art_products 
-- SET images = ARRAY[image]::TEXT[]
-- WHERE image IS NOT NULL AND (images IS NULL OR array_length(images, 1) = 0 OR array_length(images, 1) IS NULL);

-- Set default status for NULL values
-- UPDATE art_products SET status = 'active' WHERE status IS NULL;

\echo ''
\echo '============================================'
\echo 'DIAGNOSTIC COMPLETE'
\echo '============================================'

