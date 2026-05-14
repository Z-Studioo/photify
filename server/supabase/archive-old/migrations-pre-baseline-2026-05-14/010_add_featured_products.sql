-- Migration: Add Featured Products Support
-- Version: 010
-- Description: Adds featured product index and image support for homepage featured section
-- Date: 2025-10-28
-- Dependencies: 001_initial_schema.sql

BEGIN;

-- ============================================
-- Add Featured Product Columns
-- ============================================

-- Add featured_index column (1-4 for homepage positions)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured_index INTEGER CHECK (featured_index >= 1 AND featured_index <= 4);

-- Add featured_image column (separate image for featured display with specific aspect ratios)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Add comment explaining the featured system
COMMENT ON COLUMN products.featured_index IS 'Homepage featured position (1=large left, 2=top right, 3=top right, 4=bottom right). NULL if not featured.';
COMMENT ON COLUMN products.featured_image IS 'Dedicated image for featured display. Index 1: 14:9 ratio, Index 2-3: 1:1 ratio, Index 4: 21:9 ratio';

-- ============================================
-- Add Unique Constraint
-- ============================================

-- Ensure only one product per featured index position
-- Using partial unique index to allow multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_featured_index_unique 
ON products(featured_index) 
WHERE featured_index IS NOT NULL;

-- ============================================
-- Add Indexes for Performance
-- ============================================

-- Index for querying featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured 
ON products(is_featured) 
WHERE is_featured = true;

-- Index for ordering featured products by index
CREATE INDEX IF NOT EXISTS idx_products_featured_index 
ON products(featured_index) 
WHERE featured_index IS NOT NULL;

-- ============================================
-- Update Logic: Sync is_featured with featured_index
-- ============================================

-- When featured_index is set, automatically set is_featured to true
-- When featured_index is NULL, set is_featured to false
CREATE OR REPLACE FUNCTION sync_featured_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.featured_index IS NOT NULL THEN
    NEW.is_featured := true;
  ELSE
    NEW.is_featured := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_sync_featured_status ON products;

-- Create trigger
CREATE TRIGGER trigger_sync_featured_status
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_status();

-- ============================================
-- Backfill Existing Data
-- ============================================

-- Set is_featured to false for any existing products that don't have it set
UPDATE products 
SET is_featured = COALESCE(is_featured, false)
WHERE is_featured IS NULL;

COMMIT;

-- ============================================
-- Verification Queries (Run these after migration)
-- ============================================

-- Check featured products
-- SELECT id, name, is_featured, featured_index, featured_image FROM products WHERE is_featured = true ORDER BY featured_index;

-- Check for conflicts (should return 0 rows)
-- SELECT featured_index, COUNT(*) FROM products WHERE featured_index IS NOT NULL GROUP BY featured_index HAVING COUNT(*) > 1;

-- Check constraint works (should fail)
-- UPDATE products SET featured_index = 1 WHERE id = 'some-id' AND featured_index IS NULL;
-- UPDATE products SET featured_index = 1 WHERE id = 'another-id' AND featured_index IS NULL; -- This should fail

