-- Migration: Add art product size to room hotspots
-- Description: Adds art_size_id field to room_hotspots for art products
-- Date: 2025-10-29

-- Add art_size_id column to room_hotspots (references sizes table)
ALTER TABLE room_hotspots
ADD COLUMN IF NOT EXISTS art_size_id UUID REFERENCES sizes(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_room_hotspots_art_size_id ON room_hotspots(art_size_id);

-- Add comment
COMMENT ON COLUMN room_hotspots.art_size_id IS 'Selected size for art products from sizes table (required if art_product_id is set)';

