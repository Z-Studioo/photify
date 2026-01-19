-- Migration: Add category ordering and styling
-- This migration adds display_order, bg_color columns to categories table

BEGIN;

-- Add display_order column for drag-and-drop ordering
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#e8e4df',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Update RLS policies for admin operations
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

