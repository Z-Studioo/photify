-- ============================================
-- ADD SEO COLUMNS TO CATEGORIES TABLE
-- ============================================
-- Run this in Supabase SQL Editor to fix the missing columns error
-- Error: "Could not find the 'canonical_url' column of 'categories'"
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

-- Add helpful comments
COMMENT ON COLUMN categories.seo_title IS 'SEO optimized page title';
COMMENT ON COLUMN categories.seo_description IS 'Meta description for search engines';
COMMENT ON COLUMN categories.seo_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN categories.meta_robots IS 'Robots meta tag directive (index, follow, noindex, nofollow)';
COMMENT ON COLUMN categories.canonical_url IS 'Canonical URL for this category';
COMMENT ON COLUMN categories.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN categories.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN categories.og_image IS 'Open Graph image URL for social media';

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the columns were added:

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
  AND column_name IN (
    'seo_title', 'seo_description', 'seo_keywords', 
    'meta_robots', 'canonical_url', 
    'og_title', 'og_description', 'og_image'
  )
ORDER BY column_name;

-- Expected result: 8 rows showing all the SEO columns

