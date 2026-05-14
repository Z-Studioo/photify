-- Migration: Add SEO and Content Management Fields to Products
-- Description: WordPress-like content management for product pages

BEGIN;

-- Add SEO fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS meta_robots TEXT DEFAULT 'index,follow',
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add content sections (JSONB for flexibility)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS content_sections JSONB DEFAULT '[]'::jsonb;

-- Add product features and specifications
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb;

-- Add trust badges and USPs
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS trust_badges JSONB DEFAULT '[]'::jsonb;

-- Add review/rating data
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Comments on columns
COMMENT ON COLUMN products.seo_title IS 'SEO optimized title (50-60 chars)';
COMMENT ON COLUMN products.seo_description IS 'Meta description (150-160 chars)';
COMMENT ON COLUMN products.seo_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN products.meta_robots IS 'Robots meta tag directives';
COMMENT ON COLUMN products.canonical_url IS 'Canonical URL for SEO';
COMMENT ON COLUMN products.og_title IS 'Open Graph title';
COMMENT ON COLUMN products.og_description IS 'Open Graph description';
COMMENT ON COLUMN products.og_image IS 'Open Graph image URL';
COMMENT ON COLUMN products.content_sections IS 'Flexible content sections for product page';
COMMENT ON COLUMN products.features IS 'Array of product features';
COMMENT ON COLUMN products.specifications IS 'Array of product specifications {label, value}';
COMMENT ON COLUMN products.trust_badges IS 'Trust badges/USPs to display';
COMMENT ON COLUMN products.average_rating IS 'Average rating (0-5)';
COMMENT ON COLUMN products.review_count IS 'Total number of reviews';

-- Create indexes for SEO fields
CREATE INDEX IF NOT EXISTS idx_products_seo_title ON products(seo_title);
CREATE INDEX IF NOT EXISTS idx_products_canonical_url ON products(canonical_url);

COMMIT;

