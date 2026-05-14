-- Migration: Auto-Update Product Embeddings on Changes
-- File: 025_products_auto_update_embeddings.sql
-- Description: Adds trigger to invalidate embeddings when product name changes
-- Date: 2025-10-30
-- Dependencies: 024_products_semantic_search.sql

BEGIN;

-- ============================================
-- Add flag to track if embedding needs regeneration
-- ============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embedding_needs_update BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.embedding_needs_update IS 'Flag indicating embedding needs regeneration due to name/category change';

-- ============================================
-- Create trigger function to mark embeddings as stale
-- ============================================
CREATE OR REPLACE FUNCTION mark_embedding_for_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if name changed or if this is a new product
  IF TG_OP = 'INSERT' THEN
    NEW.embedding_needs_update := TRUE;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Mark for update if name changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      NEW.embedding_needs_update := TRUE;
      NEW.name_embedding := NULL; -- Clear old embedding
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create trigger on products table
-- ============================================
DROP TRIGGER IF EXISTS trigger_mark_embedding_update ON products;

CREATE TRIGGER trigger_mark_embedding_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION mark_embedding_for_update();

-- ============================================
-- Create trigger for product_categories changes
-- ============================================
CREATE OR REPLACE FUNCTION mark_product_embedding_on_category_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark product embedding for update when categories change
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE products 
    SET embedding_needs_update = TRUE,
        name_embedding = NULL
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_category_change_mark_embedding ON product_categories;

CREATE TRIGGER trigger_category_change_mark_embedding
  AFTER INSERT OR DELETE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION mark_product_embedding_on_category_change();

-- ============================================
-- Mark existing products without embeddings
-- ============================================
UPDATE products
SET embedding_needs_update = TRUE
WHERE name_embedding IS NULL AND active = TRUE;

-- ============================================
-- Create view to see products needing embedding updates
-- ============================================
CREATE OR REPLACE VIEW v_products_need_embedding AS
SELECT 
  id,
  name,
  slug,
  active,
  embedding_needs_update,
  CASE 
    WHEN name_embedding IS NULL THEN 'Missing embedding'
    WHEN embedding_needs_update THEN 'Needs regeneration'
    ELSE 'Up to date'
  END as status
FROM products
WHERE active = TRUE 
  AND (name_embedding IS NULL OR embedding_needs_update = TRUE)
ORDER BY created_at DESC;

COMMENT ON VIEW v_products_need_embedding IS 'Shows products that need embedding regeneration';

COMMIT;

