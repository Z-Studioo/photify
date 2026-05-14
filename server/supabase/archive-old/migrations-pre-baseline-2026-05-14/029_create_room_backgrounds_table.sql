-- Migration: Create Room Backgrounds Table for Multi-Canvas Wall Customizer
-- File: 029_create_room_backgrounds_table.sql
-- Description: [DEPRECATED] Creates room_backgrounds table - Now using products.config.roomBackgrounds instead
-- Date: 2025-11-05
-- Dependencies: 001_initial_schema.sql
-- 
-- ⚠️ DEPRECATED: This table is no longer used as of the product-specific room backgrounds refactor
-- Room backgrounds are now stored per-product in products.config.roomBackgrounds (JSONB)
-- This migration is kept for historical reference only

BEGIN;

-- ============================================
-- CREATE ROOM_BACKGROUNDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS room_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_room_backgrounds_active 
  ON room_backgrounds(is_active);

CREATE INDEX IF NOT EXISTS idx_room_backgrounds_display_order 
  ON room_backgrounds(display_order);

CREATE INDEX IF NOT EXISTS idx_room_backgrounds_slug 
  ON room_backgrounds(slug);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE room_backgrounds ENABLE ROW LEVEL SECURITY;

-- Public read access for active room backgrounds
DROP POLICY IF EXISTS "public_read_active_room_backgrounds" ON room_backgrounds;
CREATE POLICY "public_read_active_room_backgrounds"
  ON room_backgrounds FOR SELECT
  USING (is_active = true);

-- Allow anyone to read (for customizer)
DROP POLICY IF EXISTS "public_read_all_room_backgrounds" ON room_backgrounds;
CREATE POLICY "public_read_all_room_backgrounds"
  ON room_backgrounds FOR SELECT
  TO anon
  USING (true);

-- Admin full access (insert, update, delete)
DROP POLICY IF EXISTS "admin_full_access_room_backgrounds" ON room_backgrounds;
CREATE POLICY "admin_full_access_room_backgrounds"
  ON room_backgrounds FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'email' = 'shiv@zstudioo.com'
  );

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE room_backgrounds IS 'Background room images for multi-canvas-wall customizer';
COMMENT ON COLUMN room_backgrounds.name IS 'Display name for the room (e.g., "Living Room", "Bedroom")';
COMMENT ON COLUMN room_backgrounds.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN room_backgrounds.image_url IS 'Full URL to the room background image (Supabase Storage or external)';
COMMENT ON COLUMN room_backgrounds.description IS 'Optional description of the room';
COMMENT ON COLUMN room_backgrounds.is_active IS 'Whether this room background is available in the customizer';
COMMENT ON COLUMN room_backgrounds.display_order IS 'Order in which room backgrounds appear in the customizer';

-- ============================================
-- SEED INITIAL DATA
-- ============================================
-- Migrate existing hardcoded rooms from config.ts
INSERT INTO room_backgrounds (id, name, slug, image_url, description, is_active, display_order)
VALUES 
  (
    'c1e7f3a1-2b3c-4d5e-6f7g-8h9i0j1k2l3m',
    'Living Room',
    'living-room',
    'https://cdn.pixabay.com/photo/2018/03/04/09/51/space-3197611_1280.jpg',
    'Modern living room with warm lighting',
    true,
    1
  ),
  (
    'd2f8g4b2-3c4d-5e6f-7g8h-9i0j1k2l3m4n',
    'Bedroom',
    'bedroom',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=80',
    'Cozy bedroom interior',
    true,
    2
  ),
  (
    'e3g9h5c3-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
    'Kitchen',
    'kitchen',
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1600&q=80',
    'Contemporary kitchen space',
    true,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE UPDATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_room_backgrounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_room_backgrounds_updated_at ON room_backgrounds;
CREATE TRIGGER trigger_update_room_backgrounds_updated_at
  BEFORE UPDATE ON room_backgrounds
  FOR EACH ROW
  EXECUTE FUNCTION update_room_backgrounds_updated_at();

COMMIT;

