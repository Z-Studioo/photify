-- Migration: Convert Product Categories to Many-to-Many Relationship
-- Description: Creates a junction table to allow products to have multiple categories

BEGIN;

-- ============================================
-- UP MIGRATION
-- ============================================

-- Create product_categories junction table for many-to-many relationship
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

-- Migrate existing data from products.category_id to product_categories
-- Only if category_id column exists and has data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    -- Insert existing category relationships
    INSERT INTO product_categories (product_id, category_id)
    SELECT id, category_id
    FROM products
    WHERE category_id IS NOT NULL
    ON CONFLICT (product_id, category_id) DO NOTHING;
    
    -- Drop the old foreign key constraint if it exists
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
    
    -- Drop the old category_id column
    ALTER TABLE products DROP COLUMN IF EXISTS category_id;
  END IF;
END $$;

-- Enable RLS on the new table
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_categories
-- Allow public read access
CREATE POLICY "Allow public read access on product_categories"
ON product_categories FOR SELECT
USING (true);

-- Allow authenticated users to manage product categories
CREATE POLICY "Allow authenticated users to manage product_categories"
ON product_categories FOR ALL
USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE product_categories IS 'Junction table for many-to-many relationship between products and categories';
COMMENT ON COLUMN product_categories.product_id IS 'Reference to the product';
COMMENT ON COLUMN product_categories.category_id IS 'Reference to the category';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get all categories for a product
CREATE OR REPLACE FUNCTION get_product_categories(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  slug VARCHAR(100),
  description TEXT,
  icon VARCHAR(50)
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.slug, c.description, c.icon
  FROM categories c
  INNER JOIN product_categories pc ON c.id = pc.category_id
  WHERE pc.product_id = product_uuid;
END;
$$;

-- Function to get all products for a category
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
  active BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.slug, p.description, p.price, p.old_price, 
    p.images, p.is_featured, p.product_type, p.active
  FROM products p
  INNER JOIN product_categories pc ON p.id = pc.product_id
  WHERE pc.category_id = category_uuid AND p.active = true;
END;
$$;

COMMIT;

-- ============================================
-- DOWN MIGRATION (for rollback)
-- ============================================

-- Note: This section documents how to rollback this migration
-- Execute these commands manually if needed to rollback:

/*
BEGIN;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_product_categories(UUID);
DROP FUNCTION IF EXISTS get_category_products(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_product_categories_product;
DROP INDEX IF EXISTS idx_product_categories_category;

-- Drop the junction table
DROP TABLE IF EXISTS product_categories CASCADE;

-- Add back the old category_id column (WARNING: Data will be lost)
-- ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
-- CREATE INDEX idx_products_category ON products(category_id);

COMMIT;
*/

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after migration to verify:
-- SELECT 
--   p.name as product_name,
--   array_agg(c.name) as categories
-- FROM products p
-- LEFT JOIN product_categories pc ON p.id = pc.product_id
-- LEFT JOIN categories c ON pc.category_id = c.id
-- GROUP BY p.id, p.name
-- ORDER BY p.name;

