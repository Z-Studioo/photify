-- Migration: Update Art Product Sizes to Include Individual Images
-- Version: 017
-- Description: Changes available_sizes JSONB structure to use image_url instead of image_index
-- Date: 2025-10-29
-- Dependencies: 016_enhance_art_products.sql

BEGIN;

-- ============================================
-- BACKGROUND
-- ============================================
-- Previously: available_sizes stored as [{"size_id": "uuid", "price": 29.99, "image_index": 0}]
-- Now: available_sizes stores as [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}]
--
-- This allows each size to have its own dedicated product image rather than 
-- referencing an index in the main product images array.
--
-- REASON: Different sizes may need different image crops, angles, or compositions
-- ============================================

-- No schema changes needed - JSONB is flexible
-- But we need to update existing data if any exists

-- ============================================
-- MIGRATE EXISTING DATA (if any products exist with old format)
-- ============================================

-- This function converts old format to new format
-- Old: {"size_id": "uuid", "price": 29.99, "image_index": 0}
-- New: {"size_id": "uuid", "price": 29.99, "image_url": ""}

DO $$
DECLARE
    product_record RECORD;
    old_sizes JSONB;
    new_sizes JSONB;
    size_item JSONB;
    image_index INT;
    image_url TEXT;
BEGIN
    -- Loop through all art products
    FOR product_record IN 
        SELECT id, images, available_sizes 
        FROM art_products 
        WHERE available_sizes IS NOT NULL 
          AND jsonb_array_length(available_sizes) > 0
    LOOP
        new_sizes := '[]'::jsonb;
        
        -- Loop through each size in available_sizes
        FOR size_item IN 
            SELECT * FROM jsonb_array_elements(product_record.available_sizes)
        LOOP
            -- Check if this has old format (image_index)
            IF size_item ? 'image_index' THEN
                -- Get the image_index
                image_index := (size_item->>'image_index')::int;
                
                -- Try to get the actual image URL from the images array
                IF product_record.images IS NOT NULL 
                   AND array_length(product_record.images, 1) > image_index THEN
                    image_url := product_record.images[image_index + 1]; -- Arrays are 1-indexed in PostgreSQL
                ELSE
                    image_url := ''; -- No image available
                END IF;
                
                -- Build new format
                new_sizes := new_sizes || jsonb_build_object(
                    'size_id', size_item->>'size_id',
                    'price', (size_item->>'price')::numeric,
                    'image_url', image_url
                );
            ELSE
                -- Already in new format or unknown format, keep as-is
                new_sizes := new_sizes || size_item;
            END IF;
        END LOOP;
        
        -- Update the product with new format
        UPDATE art_products 
        SET available_sizes = new_sizes 
        WHERE id = product_record.id;
        
        RAISE NOTICE 'Updated product % with % sizes', product_record.id, jsonb_array_length(new_sizes);
    END LOOP;
END $$;

-- ============================================
-- UPDATE DOCUMENTATION
-- ============================================

COMMENT ON COLUMN art_products.available_sizes IS 'JSONB: [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}] - Each size has its own image';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the structure of available_sizes after migration
SELECT 
    id,
    name,
    jsonb_array_length(available_sizes) as size_count,
    available_sizes->0 as sample_size_structure
FROM art_products
WHERE available_sizes IS NOT NULL 
  AND jsonb_array_length(available_sizes) > 0
LIMIT 5;

-- Check if any still have old image_index format
SELECT 
    id,
    name,
    'HAS OLD FORMAT' as warning
FROM art_products
WHERE available_sizes::text LIKE '%image_index%'
LIMIT 5;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================
/*
If you need to rollback to image_index format:

BEGIN;

DO $$
DECLARE
    product_record RECORD;
    new_sizes JSONB;
    size_item JSONB;
BEGIN
    FOR product_record IN 
        SELECT id, available_sizes FROM art_products 
        WHERE available_sizes IS NOT NULL 
    LOOP
        new_sizes := '[]'::jsonb;
        
        FOR size_item IN 
            SELECT * FROM jsonb_array_elements(product_record.available_sizes)
        LOOP
            new_sizes := new_sizes || jsonb_build_object(
                'size_id', size_item->>'size_id',
                'price', (size_item->>'price')::numeric,
                'image_index', 0
            );
        END LOOP;
        
        UPDATE art_products 
        SET available_sizes = new_sizes 
        WHERE id = product_record.id;
    END LOOP;
END $$;

COMMIT;
*/

