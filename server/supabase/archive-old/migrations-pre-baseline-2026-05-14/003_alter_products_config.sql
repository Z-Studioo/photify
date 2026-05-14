-- Migration: Alter Products Table for Configuration Support
-- Description: Adds product configuration fields, indexes, and triggers to the products table

BEGIN;

-- ============================================
-- UP MIGRATION
-- ============================================

-- Enable pgcrypto extension for UUID generation and other crypto functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns to products table (only if they don't exist)
DO $$ 
BEGIN
  -- Add product_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'canvas' 
      CHECK (product_type IN ('canvas','framed_canvas','metal_print'));
  END IF;

  -- Add active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'active'
  ) THEN
    ALTER TABLE products ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add config column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'config'
  ) THEN
    ALTER TABLE products ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Add config_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'config_status'
  ) THEN
    ALTER TABLE products ADD COLUMN config_status TEXT NOT NULL DEFAULT 'draft' 
      CHECK (config_status IN ('draft','active'));
  END IF;

  -- Add config_version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'config_version'
  ) THEN
    ALTER TABLE products ADD COLUMN config_version INT NOT NULL DEFAULT 1;
  END IF;

  -- Add config_updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'config_updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN config_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Add created_at column if missing (from initial schema it should exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE products ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Add updated_at column if missing (from initial schema it should exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  
  -- Drop size column as it's now managed in config JSON
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'size'
  ) THEN
    ALTER TABLE products DROP COLUMN size;
  END IF;
END $$;

-- Add constraint to prevent empty config when status is active
-- Drop if exists first to avoid conflicts on re-run
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_config_active_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_config_active_check;
  END IF;
END $$;

ALTER TABLE products ADD CONSTRAINT products_config_active_check
  CHECK (config_status <> 'active' OR (jsonb_typeof(config) = 'object' AND config <> '{}'::jsonb));

-- ============================================
-- INDEXES
-- ============================================

-- Unique index on slug (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_slug_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_products_slug_unique ON products(slug);
  END IF;
END $$;

-- Btree index on product_type (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_product_type'
  ) THEN
    CREATE INDEX idx_products_product_type ON products(product_type);
  END IF;
END $$;

-- Btree index on active status (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_active'
  ) THEN
    CREATE INDEX idx_products_active ON products(active);
  END IF;
END $$;

-- GIN index on config JSONB (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_config_gin'
  ) THEN
    CREATE INDEX idx_products_config_gin ON products USING GIN(config);
  END IF;
END $$;

-- Index on config_status for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_config_status'
  ) THEN
    CREATE INDEX idx_products_config_status ON products(config_status);
  END IF;
END $$;

-- ============================================
-- TRIGGER FUNCTION FOR AUTO-UPDATE updated_at
-- ============================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ============================================
-- BACKFILL EXISTING DATA
-- ============================================

-- Backfill product_type for existing rows (if NULL)
UPDATE products 
SET product_type = 'canvas' 
WHERE product_type IS NULL;

-- Backfill active status for existing rows
UPDATE products 
SET active = true 
WHERE active IS NULL;

-- Fix config_status for rows with active status but empty config
UPDATE products 
SET config_status = 'draft' 
WHERE config_status = 'active' 
  AND (config = '{}'::jsonb OR config IS NULL);

-- Ensure config is not NULL
UPDATE products 
SET config = '{}'::jsonb 
WHERE config IS NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN products.product_type IS 'Type of product: canvas, framed_canvas, or metal_print';
COMMENT ON COLUMN products.active IS 'Whether the product is active and visible to customers';
COMMENT ON COLUMN products.config IS 'JSONB configuration for product variants, pricing, and options';
COMMENT ON COLUMN products.config_status IS 'Configuration status: draft or active';
COMMENT ON COLUMN products.config_version IS 'Version number for config changes tracking';
COMMENT ON COLUMN products.config_updated_at IS 'Timestamp of last config update';
COMMENT ON COLUMN products.price IS 'Base price per square inch for this product type';
COMMENT ON COLUMN products.old_price IS 'Old/discounted price per square inch (optional)';

-- ============================================
-- DOWN MIGRATION (for rollback)
-- ============================================

-- Note: This section documents how to rollback this migration
-- Execute these commands manually if needed to rollback:

/*
BEGIN;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
DROP FUNCTION IF EXISTS update_products_updated_at();

-- Drop indexes created by this migration
DROP INDEX IF EXISTS idx_products_slug_unique;
DROP INDEX IF EXISTS idx_products_product_type;
DROP INDEX IF EXISTS idx_products_active;
DROP INDEX IF EXISTS idx_products_config_gin;
DROP INDEX IF EXISTS idx_products_config_status;

-- Drop constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_config_active_check;

-- Drop columns added by this migration (WARNING: This will delete data)
-- Only uncomment if you're absolutely sure you want to remove these columns
-- ALTER TABLE products DROP COLUMN IF EXISTS product_type;
-- ALTER TABLE products DROP COLUMN IF EXISTS active;
-- ALTER TABLE products DROP COLUMN IF EXISTS config;
-- ALTER TABLE products DROP COLUMN IF EXISTS config_status;
-- ALTER TABLE products DROP COLUMN IF EXISTS config_version;
-- ALTER TABLE products DROP COLUMN IF EXISTS config_updated_at;

COMMIT;
*/

COMMIT;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after migration to verify:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- ORDER BY ordinal_position;

