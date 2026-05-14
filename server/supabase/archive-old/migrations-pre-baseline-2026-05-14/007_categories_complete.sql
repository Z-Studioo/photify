-- Migration: Complete Categories Enhancement
-- Version: 007 (Consolidates 007, 008, 009)
-- Description: Adds ordering, images, SEO fields, product associations, and views
-- Date: 2025-10-27
-- 
-- This migration combines:
--   - Category ordering (display_order, bg_color, is_active)
--   - Image support (image_url)
--   - SEO fields (seo_title, seo_description, etc.)
--   - Product association functions
--   - Category views with product counts

BEGIN;

-- ============================================
-- STEP 1: Add All Category Columns
-- ============================================

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#e8e4df',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow',
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- ============================================
-- STEP 2: Add Column Comments
-- ============================================

COMMENT ON COLUMN categories.display_order IS 'Order for drag-and-drop sorting (lower = higher priority)';
COMMENT ON COLUMN categories.bg_color IS 'Hex color code for category background';
COMMENT ON COLUMN categories.is_active IS 'Whether category is visible on website';
COMMENT ON COLUMN categories.image_url IS 'URL of the category image (replaces icon for visual representation)';
COMMENT ON COLUMN categories.seo_title IS 'SEO optimized page title';
COMMENT ON COLUMN categories.seo_description IS 'Meta description for search engines';
COMMENT ON COLUMN categories.seo_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN categories.meta_robots IS 'Robots meta tag directive (index, follow, noindex, nofollow)';
COMMENT ON COLUMN categories.canonical_url IS 'Canonical URL for this category';
COMMENT ON COLUMN categories.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN categories.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN categories.og_image IS 'Open Graph image URL for social media';

-- ============================================
-- STEP 3: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================
-- STEP 4: Update RLS Policies
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Admin update categories" ON categories;
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;

-- Allow public read access
CREATE POLICY "Allow public read access on categories"
ON categories FOR SELECT
USING (true);

-- Allow authenticated users (admins) full access
CREATE POLICY "Admin update categories" 
ON categories FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin insert categories" 
ON categories FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin delete categories" 
ON categories FOR DELETE 
TO authenticated 
USING (true);

-- ============================================
-- STEP 5: Create Helper Function
-- ============================================

-- Function to get products for a specific category
DROP FUNCTION IF EXISTS get_category_products(UUID);

CREATE OR REPLACE FUNCTION get_category_products(category_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  slug VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  old_price DECIMAL(10, 2),
  images TEXT[],
  is_featured BOOLEAN,
  product_type TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.slug, p.description, p.price, p.old_price, 
    p.images, p.is_featured, p.product_type, p.active, p.created_at
  FROM products p
  INNER JOIN product_categories pc ON p.id = pc.product_id
  WHERE pc.category_id = category_uuid
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_category_products(UUID) TO authenticated, anon;

-- ============================================
-- STEP 6: Create View for Categories with Counts
-- ============================================

DROP VIEW IF EXISTS v_categories_with_counts;

CREATE OR REPLACE VIEW v_categories_with_counts AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.description,
  c.icon,
  c.image_url,
  c.bg_color,
  c.display_order,
  c.is_active,
  c.created_at,
  c.updated_at,
  c.seo_title,
  c.seo_description,
  c.seo_keywords,
  c.meta_robots,
  c.canonical_url,
  c.og_title,
  c.og_description,
  c.og_image,
  COUNT(DISTINCT pc.product_id) as product_count,
  COUNT(DISTINCT CASE WHEN p.active = true THEN pc.product_id END) as active_product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.category_id
LEFT JOIN products p ON pc.product_id = p.id
GROUP BY c.id
ORDER BY c.display_order;

-- Grant access to the view
GRANT SELECT ON v_categories_with_counts TO authenticated, anon;

COMMIT;

-- ============================================
-- VERIFICATION QUERY (Comment out in production)
-- ============================================
-- Run this separately to verify the migration:
/*
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
*/

