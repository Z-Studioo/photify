-- Migration: Add SEO fields to categories
-- Description: Adds SEO metadata fields for better search engine optimization

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
COMMENT ON COLUMN categories.meta_robots IS 'Robots meta tag directive (index, follow, noindex, nofollow)';
COMMENT ON COLUMN categories.canonical_url IS 'Canonical URL for this category';
COMMENT ON COLUMN categories.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN categories.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN categories.og_image IS 'Open Graph image URL for social media';

COMMIT;

