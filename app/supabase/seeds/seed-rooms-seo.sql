-- Seed: Add SEO data to existing rooms
-- Description: Adds SEO metadata to the existing rooms
-- Date: 2025-10-29

-- Update existing rooms with SEO data
UPDATE rooms
SET 
    seo_title = title || ' - Room Inspiration | Photify',
    seo_description = COALESCE(description, 'Discover beautiful ' || title || ' inspiration with curated photo prints and wall art from Photify.'),
    seo_keywords = ARRAY['room inspiration', 'interior design', LOWER(title), 'wall art', 'photo prints', 'home decor'],
    canonical_url = 'https://photify.com/room/' || slug,
    og_title = title || ' - Room Inspiration',
    og_description = COALESCE(description, 'Discover beautiful ' || title || ' inspiration with curated photo prints and wall art.'),
    og_image = image
WHERE seo_title IS NULL;

-- Log the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM rooms WHERE seo_title IS NOT NULL;
    RAISE NOTICE 'Updated SEO fields for % rooms', updated_count;
END $$;

