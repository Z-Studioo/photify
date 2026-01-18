-- Migration: Add image support to categories
-- Description: Adds image_url column and updates categories to use images instead of icons

BEGIN;

-- Add image_url column to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN categories.image_url IS 'URL of the category image (replaces icon for visual representation)';

-- Update the get_category_products function to return more product details
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

-- Create a view to get category with product count
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

