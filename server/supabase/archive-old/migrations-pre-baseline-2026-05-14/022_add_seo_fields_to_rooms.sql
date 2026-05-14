-- Migration: Add SEO and Content fields to rooms table
-- Description: Adds SEO metadata fields to rooms table for better search engine optimization
-- Author: AI Assistant
-- Date: 2025-10-29

-- Add SEO fields to rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rooms.seo_title IS 'SEO optimized page title (50-60 characters recommended)';
COMMENT ON COLUMN rooms.seo_description IS 'SEO meta description (150-160 characters recommended)';
COMMENT ON COLUMN rooms.seo_keywords IS 'Array of SEO keywords for the room';
COMMENT ON COLUMN rooms.canonical_url IS 'Canonical URL for the room page';
COMMENT ON COLUMN rooms.og_title IS 'Open Graph title for social media sharing';
COMMENT ON COLUMN rooms.og_description IS 'Open Graph description for social media sharing';
COMMENT ON COLUMN rooms.og_image IS 'Open Graph image URL for social media sharing';

-- Create index on seo_keywords for better search performance
CREATE INDEX IF NOT EXISTS idx_rooms_seo_keywords ON rooms USING GIN (seo_keywords);

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_rooms_updated_at ON rooms;
CREATE TRIGGER trigger_update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_rooms_updated_at();

