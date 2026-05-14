-- Migration: Add Fixed Pricing to Sizes Table
-- Description: Switch from base pricing to fixed pricing per size
-- Adds fixed_price column directly to sizes table for simpler pricing management

-- ============================================
-- ADD FIXED PRICE COLUMN TO SIZES TABLE
-- ============================================

-- Add fixed_price column to sizes table
ALTER TABLE sizes
ADD COLUMN fixed_price DECIMAL(10, 2);

ALTER TABLE products
ADD COLUMN fixed_price DECIMAL(10, 2);

-- ============================================
-- UPDATE VIEW TO INCLUDE FIXED PRICE
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_sizes_with_ratios CASCADE;

-- Recreate view with fixed_price included
CREATE OR REPLACE VIEW v_sizes_with_ratios AS
SELECT
    s.id,
    s.width_in,
    s.height_in,
    s.display_label,
    s.area_in2,
    s.long_side_in,
    s.short_side_in,
    s.active,
    s.fixed_price,
    s.created_at,
    ar.label AS ratio_label,
    ar.width_ratio,
    ar.height_ratio,
    ar.orientation
FROM sizes s
JOIN aspect_ratios ar ON s.aspect_ratio_id = ar.id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN sizes.fixed_price IS 'Fixed price for this size (replaces base_price × area calculation)';
