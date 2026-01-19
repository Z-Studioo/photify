-- Migration: Product Tags System
-- File: 026_product_tags_system.sql
-- Description: Creates tags table and junction tables for products and art_products
-- Date: 2025-10-30
-- Dependencies: 001_initial_schema.sql, 004_product_categories_many_to_many.sql, 016_enhance_art_products.sql

BEGIN;

-- ============================================
-- Create Tags Table
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20) DEFAULT '#f63a9e', -- Badge color (hex code or Tailwind class)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Junction Table: product_tags
-- ============================================
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a product can't have the same tag twice
  UNIQUE(product_id, tag_id)
);

-- ============================================
-- Create Junction Table: art_product_tags
-- ============================================
CREATE TABLE IF NOT EXISTS art_product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_product_id UUID NOT NULL REFERENCES art_products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure an art product can't have the same tag twice
  UNIQUE(art_product_id, tag_id)
);

-- ============================================
-- Create Indexes
-- ============================================

-- Indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Indexes for product_tags junction table
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag_id);

-- Indexes for art_product_tags junction table
CREATE INDEX IF NOT EXISTS idx_art_product_tags_art_product ON art_product_tags(art_product_id);
CREATE INDEX IF NOT EXISTS idx_art_product_tags_tag ON art_product_tags(tag_id);

-- ============================================
-- Enable RLS (Row Level Security)
-- ============================================

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_tags
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Enable RLS on art_product_tags
ALTER TABLE art_product_tags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for tags
-- ============================================

-- Public read access to tags
DROP POLICY IF EXISTS "Public read tags" ON tags;
CREATE POLICY "Public read tags"
  ON tags FOR SELECT
  USING (true);

-- Admin full access to tags
DROP POLICY IF EXISTS "Admin manage tags" ON tags;
CREATE POLICY "Admin manage tags"
  ON tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- RLS Policies for product_tags
-- ============================================

-- Public read access
DROP POLICY IF EXISTS "Public read product_tags" ON product_tags;
CREATE POLICY "Public read product_tags"
  ON product_tags FOR SELECT
  USING (true);

-- Admin manage access
DROP POLICY IF EXISTS "Admin manage product_tags" ON product_tags;
CREATE POLICY "Admin manage product_tags"
  ON product_tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- RLS Policies for art_product_tags
-- ============================================

-- Public read access
DROP POLICY IF EXISTS "Public read art_product_tags" ON art_product_tags;
CREATE POLICY "Public read art_product_tags"
  ON art_product_tags FOR SELECT
  USING (true);

-- Admin manage access
DROP POLICY IF EXISTS "Admin manage art_product_tags" ON art_product_tags;
CREATE POLICY "Admin manage art_product_tags"
  ON art_product_tags FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Triggers for updated_at
-- ============================================

-- Trigger for tags table
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get all tags for a product
CREATE OR REPLACE FUNCTION get_product_tags(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  slug VARCHAR(50),
  color VARCHAR(20),
  description TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.slug, t.color, t.description
  FROM tags t
  INNER JOIN product_tags pt ON t.id = pt.tag_id
  WHERE pt.product_id = product_uuid
  ORDER BY t.name;
END;
$$;

-- Function to get all tags for an art product
CREATE OR REPLACE FUNCTION get_art_product_tags(art_product_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  slug VARCHAR(50),
  color VARCHAR(20),
  description TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, t.slug, t.color, t.description
  FROM tags t
  INNER JOIN art_product_tags apt ON t.id = apt.tag_id
  WHERE apt.art_product_id = art_product_uuid
  ORDER BY t.name;
END;
$$;

-- Function to count products using a tag
CREATE OR REPLACE FUNCTION count_products_with_tag(tag_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  product_count INTEGER;
  art_product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count
  FROM product_tags
  WHERE tag_id = tag_uuid;
  
  SELECT COUNT(*) INTO art_product_count
  FROM art_product_tags
  WHERE tag_id = tag_uuid;
  
  RETURN product_count + art_product_count;
END;
$$;

-- ============================================
-- Add Table Comments
-- ============================================

COMMENT ON TABLE tags IS 'Product tags for categorization and filtering';
COMMENT ON COLUMN tags.name IS 'Display name of the tag';
COMMENT ON COLUMN tags.slug IS 'URL-friendly slug';
COMMENT ON COLUMN tags.color IS 'Badge color for display (hex or Tailwind class)';

COMMENT ON TABLE product_tags IS 'Junction table for many-to-many relationship between products and tags';
COMMENT ON COLUMN product_tags.product_id IS 'Reference to the product';
COMMENT ON COLUMN product_tags.tag_id IS 'Reference to the tag';

COMMENT ON TABLE art_product_tags IS 'Junction table for many-to-many relationship between art_products and tags';
COMMENT ON COLUMN art_product_tags.art_product_id IS 'Reference to the art product';
COMMENT ON COLUMN art_product_tags.tag_id IS 'Reference to the tag';

-- ============================================
-- Seed Initial Tags (Optional)
-- ============================================

INSERT INTO tags (id, name, slug, color, description) VALUES
  (gen_random_uuid(), 'Best Seller', 'best-seller', '#f63a9e', 'Top selling products'),
  (gen_random_uuid(), 'New', 'new', '#10b981', 'Recently added products'),
  (gen_random_uuid(), 'Limited Edition', 'limited-edition', '#f59e0b', 'Limited availability'),
  (gen_random_uuid(), 'Popular', 'popular', '#3b82f6', 'Popular among customers'),
  (gen_random_uuid(), 'Eco-Friendly', 'eco-friendly', '#22c55e', 'Environmentally conscious materials')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tags', 'product_tags', 'art_product_tags');

-- Check initial tags
-- SELECT * FROM tags;

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('tags', 'product_tags', 'art_product_tags');

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename IN ('tags', 'product_tags', 'art_product_tags');

