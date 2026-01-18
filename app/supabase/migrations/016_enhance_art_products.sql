-- Migration: Enhance Art Products with Multiple Images, Sizes, and SEO
-- Version: 016
-- Description: Upgrades art_products table to match product features
-- Date: 2025-10-29
-- Dependencies: 001_initial_schema.sql, 002_aspect_ratios_sizes_variants.sql

BEGIN;

-- ============================================
-- Backup existing data
-- ============================================
-- Create temporary backup table
CREATE TABLE IF NOT EXISTS art_products_backup AS 
SELECT * FROM art_products;

-- ============================================
-- Add new columns to art_products
-- ============================================

-- Multiple Images (like products)
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Product Type
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'Canvas';

-- Customization Link
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS customization_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS allow_customization BOOLEAN DEFAULT false;

-- SEO Fields
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS meta_title TEXT;

ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];

-- Content Fields (JSONB)
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb;

ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS trust_badges JSONB DEFAULT '[]'::jsonb;

-- Aspect Ratio (single selection)
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS aspect_ratio_id UUID REFERENCES aspect_ratios(id) ON DELETE SET NULL;

-- Available Sizes (JSONB array)
-- Format: [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}]
-- NOTE: Migration 017 updates this from image_index to image_url
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS available_sizes JSONB DEFAULT '[]'::jsonb;

-- Stock Management
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Status field (like products)
ALTER TABLE art_products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));

-- ============================================
-- Migrate existing data
-- ============================================

-- Migrate single image to images array
UPDATE art_products 
SET images = ARRAY[image]::TEXT[]
WHERE image IS NOT NULL AND images = ARRAY[]::TEXT[];

-- Set default stock
UPDATE art_products 
SET stock_quantity = 50 
WHERE stock_quantity = 0;

-- Set default status based on existing data
UPDATE art_products 
SET status = 'active';

-- Set default meta_title from name
UPDATE art_products 
SET meta_title = name || ' - Art Print'
WHERE meta_title IS NULL;

-- Set default meta_description from description
UPDATE art_products 
SET meta_description = COALESCE(
  SUBSTRING(description FROM 1 FOR 155), 
  'Beautiful ' || name || ' art print available in multiple sizes.'
)
WHERE meta_description IS NULL;

-- ============================================
-- Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_art_products_product_type 
ON art_products(product_type);

CREATE INDEX IF NOT EXISTS idx_art_products_aspect_ratio 
ON art_products(aspect_ratio_id);

CREATE INDEX IF NOT EXISTS idx_art_products_customization 
ON art_products(customization_product_id);

CREATE INDEX IF NOT EXISTS idx_art_products_status 
ON art_products(status);

-- GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_art_products_features 
ON art_products USING GIN (features);

CREATE INDEX IF NOT EXISTS idx_art_products_sizes 
ON art_products USING GIN (available_sizes);

-- ============================================
-- Update RLS Policies
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Public read art_products" ON art_products;
DROP POLICY IF EXISTS "Allow authenticated manage art_products" ON art_products;

-- Recreate with status filter for public read
CREATE POLICY "Public read active art_products" 
ON art_products FOR SELECT 
USING (status = 'active' OR status IS NULL);

-- Admin policies (matches pattern from 005_add_admin_policies.sql)
CREATE POLICY "Allow authenticated manage art_products" 
ON art_products 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN art_products.images IS 'Array of image URLs (Supabase Storage), reorderable';
COMMENT ON COLUMN art_products.product_type IS 'Canvas, T-shirt, Poster, Framed Print, Mug, etc.';
COMMENT ON COLUMN art_products.customization_product_id IS 'Links to products table for customization redirect';
COMMENT ON COLUMN art_products.aspect_ratio_id IS 'Single aspect ratio for all sizes (1:1, 3:4, etc.)';
COMMENT ON COLUMN art_products.available_sizes IS 'JSONB: [{"size_id": "uuid", "price": 29.99, "image_url": "https://..."}] - See migration 017 for image_url update';
COMMENT ON COLUMN art_products.features IS 'JSONB array of feature strings';
COMMENT ON COLUMN art_products.specifications IS 'JSONB array of {label, value} objects';

-- ============================================
-- Note: Keep old columns for now for backward compatibility
-- Can be dropped in a future migration after verifying data
-- ============================================
-- DO NOT DROP: image, size (will deprecate after full migration verification)

COMMIT;

