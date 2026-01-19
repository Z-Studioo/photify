-- Complete Category Setup with Images
-- Run this in your Supabase SQL Editor
-- This includes: ordering, images, product counts, and associations

-- ============================================
-- STEP 1: Add Ordering Columns (if not exists)
-- ============================================

BEGIN;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#e8e4df',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

DROP POLICY IF EXISTS "Admin update categories" ON categories;
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
DROP POLICY IF EXISTS "Admin delete categories" ON categories;

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

COMMIT;

-- ============================================
-- STEP 1.5: Ensure product_categories table exists
-- ============================================

BEGIN;

-- Recreate product_categories table if missing
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on product_categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_categories" ON product_categories;

CREATE POLICY "Allow public read access on product_categories"
ON product_categories FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to manage product_categories"
ON product_categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;

-- ============================================
-- STEP 2: Add Image Support
-- ============================================

BEGIN;

-- Add image_url column
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN categories.image_url IS 'URL of the category image (replaces icon for visual representation)';

-- Add SEO fields
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow',
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

COMMENT ON COLUMN categories.seo_title IS 'SEO optimized page title';
COMMENT ON COLUMN categories.seo_description IS 'Meta description for search engines';
COMMENT ON COLUMN categories.seo_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN categories.meta_robots IS 'Robots meta tag directive';
COMMENT ON COLUMN categories.canonical_url IS 'Canonical URL for this category';
COMMENT ON COLUMN categories.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN categories.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN categories.og_image IS 'Open Graph image URL for social media';

-- Update or create the get_category_products function
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

-- Create a view to get categories with product counts
DROP VIEW IF EXISTS v_categories_with_counts;

CREATE OR REPLACE VIEW v_categories_with_counts AS
SELECT 
  c.*,
  COUNT(DISTINCT pc.product_id) as product_count,
  COUNT(DISTINCT CASE WHEN p.active = true THEN pc.product_id END) as active_product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.category_id
LEFT JOIN products p ON pc.product_id = p.id
GROUP BY c.id;

-- Grant access to the view
GRANT SELECT ON v_categories_with_counts TO authenticated, anon;

COMMIT;

-- ============================================
-- STEP 2.5: Add SEO Fields
-- ============================================

BEGIN;

-- Add SEO fields to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index, follow',
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add comments
COMMENT ON COLUMN categories.seo_title IS 'SEO optimized page title';
COMMENT ON COLUMN categories.seo_description IS 'Meta description for search engines';
COMMENT ON COLUMN categories.seo_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN categories.meta_robots IS 'Robots meta tag directive';
COMMENT ON COLUMN categories.canonical_url IS 'Canonical URL for this category';
COMMENT ON COLUMN categories.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN categories.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN categories.og_image IS 'Open Graph image URL for social media';

COMMIT;

-- ============================================
-- STEP 3: Populate Categories with Images
-- ============================================

BEGIN;

-- Clear existing categories (CAREFUL!)
TRUNCATE TABLE categories CASCADE;

-- Insert categories with image URLs
INSERT INTO categories (id, name, slug, icon, image_url, bg_color, display_order, is_active, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Custom Frames', 'custom-frames', 'Frame', 
 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80', 
 '#e8e4df', 1, true, 'Premium custom frames for your photos'),

('22222222-2222-2222-2222-222222222222', 'Gallery Walls', 'gallery-walls', 'Layout', 
 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&q=80', 
 '#dfe3e8', 2, true, 'Create stunning gallery wall arrangements'),

('33333333-3333-3333-3333-333333333333', 'Canvas Prints', 'canvas-prints', 'Image', 
 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', 
 '#e8dfe0', 3, true, 'High-quality canvas prints'),

('44444444-4444-4444-4444-444444444444', 'Art Collection', 'art-collection', 'Palette', 
 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80', 
 '#dfe8e4', 4, true, 'Curated art collection'),

('55555555-5555-5555-5555-555555555555', 'Photo Prints', 'photo-prints', 'Printer', 
 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=800&q=80', 
 '#e4e8df', 5, true, 'Professional photo prints'),

('66666666-6666-6666-6666-666666666666', 'Posters', 'posters', 'Sparkles', 
 'https://images.unsplash.com/photo-1611761481254-8c0317c2fdf6?w=800&q=80', 
 '#e8e0df', 6, true, 'Vibrant poster prints'),

('77777777-7777-7777-7777-777777777777', 'Photo Books', 'photo-books', 'BookOpen', 
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', 
 '#dfe4e8', 7, true, 'Custom photo books'),

('88888888-8888-8888-8888-888888888888', 'Gift Sets', 'gift-sets', 'Gift', 
 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80', 
 '#e8dfdf', 8, true, 'Perfect gift sets');

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check categories with product counts
SELECT 
  name, 
  slug, 
  image_url IS NOT NULL as has_image,
  display_order, 
  is_active,
  product_count,
  active_product_count
FROM v_categories_with_counts 
ORDER BY display_order;

