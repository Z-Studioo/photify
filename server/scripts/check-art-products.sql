-- Quick diagnostic for art_products table
-- Run this in Supabase SQL Editor to check your data

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'art_products'
ORDER BY ordinal_position;

-- 2. Count total records
SELECT COUNT(*) as total_products FROM art_products;

-- 3. Show all products with their new columns
SELECT 
    id,
    name,
    slug,
    product_type,
    status,
    CASE 
        WHEN images IS NOT NULL THEN array_length(images, 1)
        ELSE 0
    END as image_count,
    CASE 
        WHEN available_sizes IS NOT NULL THEN jsonb_array_length(available_sizes)
        ELSE 0
    END as size_count,
    created_at
FROM art_products
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if any products have old 'image' column but not 'images'
-- (This would indicate migration didn't fully run)
SELECT 
    id, 
    name,
    image as old_single_image,
    images as new_images_array,
    CASE 
        WHEN image IS NOT NULL AND (images IS NULL OR array_length(images, 1) = 0) 
        THEN 'NEEDS MIGRATION'
        ELSE 'OK'
    END as migration_status
FROM art_products
LIMIT 5;

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'art_products';

