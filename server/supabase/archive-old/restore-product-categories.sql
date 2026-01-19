-- Restore product_categories table
-- Run this in Supabase SQL Editor if you accidentally deleted the table

BEGIN;

-- ============================================
-- Recreate product_categories junction table
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure a product can't have the same category twice
    UNIQUE(product_id, category_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Enable RLS on the table
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Add comments
COMMENT ON TABLE product_categories IS 'Junction table for many-to-many relationship between products and categories';
COMMENT ON COLUMN product_categories.product_id IS 'Reference to the product';
COMMENT ON COLUMN product_categories.category_id IS 'Reference to the category';

-- ============================================
-- Recreate helper functions
-- ============================================

-- Function to get all categories for a product
DROP FUNCTION IF EXISTS get_product_categories(UUID);

CREATE OR REPLACE FUNCTION get_product_categories(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  slug VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  image_url TEXT,
  bg_color VARCHAR(7)
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_url, c.bg_color
  FROM categories c
  INNER JOIN product_categories pc ON c.id = pc.category_id
  WHERE pc.product_id = product_uuid;
END;
$$;

-- Function to get all products for a category
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

-- ============================================
-- Recreate the view (depends on product_categories)
-- ============================================

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
-- VERIFICATION
-- ============================================

-- Check if table was created
SELECT 
  'product_categories table recreated' as status,
  COUNT(*) as row_count 
FROM product_categories;

-- Check if functions exist
SELECT 'Functions recreated' as status,
  COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('get_product_categories', 'get_category_products');

-- Check if view exists
SELECT 'View recreated' as status,
  COUNT(*) as category_count
FROM v_categories_with_counts;

