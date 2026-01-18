-- Complete Category Setup Script
-- Run this in your Supabase SQL Editor to set up categories with ordering

-- ============================================
-- STEP 1: Add Columns (if not exists)
-- ============================================

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

-- ============================================
-- STEP 2: Populate Categories with Mock Data
-- ============================================

BEGIN;

-- Clear existing categories (CAREFUL: This will delete all categories!)
TRUNCATE TABLE categories CASCADE;

-- Insert categories with proper ordering
INSERT INTO categories (id, name, slug, icon, bg_color, display_order, is_active, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Custom Frames', 'custom-frames', 'Frame', '#e8e4df', 1, true, 'Premium custom frames for your photos'),
('22222222-2222-2222-2222-222222222222', 'Gallery Walls', 'gallery-walls', 'Layout', '#dfe3e8', 2, true, 'Create stunning gallery wall arrangements'),
('33333333-3333-3333-3333-333333333333', 'Canvas Prints', 'canvas-prints', 'Image', '#e8dfe0', 3, true, 'High-quality canvas prints'),
('44444444-4444-4444-4444-444444444444', 'Art Collection', 'art-collection', 'Palette', '#dfe8e4', 4, true, 'Curated art collection'),
('55555555-5555-5555-5555-555555555555', 'Photo Prints', 'photo-prints', 'Printer', '#e4e8df', 5, true, 'Professional photo prints'),
('66666666-6666-6666-6666-666666666666', 'Posters', 'posters', 'Sparkles', '#e8e0df', 6, true, 'Vibrant poster prints'),
('77777777-7777-7777-7777-777777777777', 'Photo Books', 'photo-books', 'BookOpen', '#dfe4e8', 7, true, 'Custom photo books'),
('88888888-8888-8888-8888-888888888888', 'Gift Sets', 'gift-sets', 'Gift', '#e8dfdf', 8, true, 'Perfect gift sets');

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if categories were inserted successfully
SELECT 
  name, 
  slug, 
  icon, 
  bg_color, 
  display_order, 
  is_active 
FROM categories 
ORDER BY display_order;

