-- Migration: Create Room Hotspots Table
-- Version: 019
-- Description: Create room_hotspots table for interactive product markers in room inspiration images
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- CREATE ROOM_HOTSPOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS room_hotspots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    art_product_id UUID REFERENCES art_products(id) ON DELETE SET NULL,
    position_x DECIMAL(5, 2) NOT NULL CHECK (position_x >= 0 AND position_x <= 100),
    position_y DECIMAL(5, 2) NOT NULL CHECK (position_y >= 0 AND position_y <= 100),
    display_order INTEGER DEFAULT 0,
    label VARCHAR(255), -- Optional custom label
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT hotspot_has_product CHECK (
        product_id IS NOT NULL OR art_product_id IS NOT NULL
    )
);

-- ============================================
-- ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_room_hotspots_room_id ON room_hotspots(room_id);
CREATE INDEX IF NOT EXISTS idx_room_hotspots_product_id ON room_hotspots(product_id);
CREATE INDEX IF NOT EXISTS idx_room_hotspots_art_product_id ON room_hotspots(art_product_id);
CREATE INDEX IF NOT EXISTS idx_room_hotspots_display_order ON room_hotspots(room_id, display_order);
CREATE INDEX IF NOT EXISTS idx_room_hotspots_is_active ON room_hotspots(is_active);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE room_hotspots IS 'Interactive product markers on room inspiration images';
COMMENT ON COLUMN room_hotspots.room_id IS 'Reference to rooms table';
COMMENT ON COLUMN room_hotspots.product_id IS 'Reference to customizable products';
COMMENT ON COLUMN room_hotspots.art_product_id IS 'Reference to art collection products';
COMMENT ON COLUMN room_hotspots.position_x IS 'Horizontal position as percentage (0-100) from left';
COMMENT ON COLUMN room_hotspots.position_y IS 'Vertical position as percentage (0-100) from top';
COMMENT ON COLUMN room_hotspots.display_order IS 'Order in which hotspots appear (lower = first)';
COMMENT ON COLUMN room_hotspots.label IS 'Optional custom label for hotspot (overrides product name)';

-- ============================================
-- ADD TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_room_hotspots_updated_at 
    BEFORE UPDATE ON room_hotspots
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE room_hotspots ENABLE ROW LEVEL SECURITY;

-- Public can read active hotspots
CREATE POLICY "Public read active hotspots" 
    ON room_hotspots FOR SELECT 
    USING (is_active = true);

-- Authenticated users (admins) can do everything
CREATE POLICY "Admins manage hotspots" 
    ON room_hotspots FOR ALL 
    USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER VIEW: Hotspots with Product Details
-- ============================================

CREATE OR REPLACE VIEW v_room_hotspots_with_products AS
SELECT 
    h.id,
    h.room_id,
    h.position_x,
    h.position_y,
    h.display_order,
    h.label,
    h.is_active,
    -- Product details (customizable)
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.price as product_price,
    p.images as product_images,
    'product' as product_type,
    -- Art product details
    a.id as art_product_id,
    a.name as art_product_name,
    a.slug as art_product_slug,
    a.price as art_product_price,
    a.images as art_product_images,
    -- Combined fields for easy access
    COALESCE(h.label, p.name, a.name) as display_name,
    COALESCE(p.slug, a.slug) as product_link,
    COALESCE(p.images[1], a.images[1]) as thumbnail_image
FROM room_hotspots h
LEFT JOIN products p ON h.product_id = p.id
LEFT JOIN art_products a ON h.art_product_id = a.id
WHERE h.is_active = true
ORDER BY h.room_id, h.display_order;

COMMENT ON VIEW v_room_hotspots_with_products IS 'Room hotspots with full product details for easy querying';

-- ============================================
-- HELPER FUNCTION: Get hotspots for a room
-- ============================================

CREATE OR REPLACE FUNCTION get_room_hotspots(room_uuid UUID)
RETURNS TABLE(
    hotspot_id UUID,
    position_x DECIMAL,
    position_y DECIMAL,
    display_order INTEGER,
    product_name VARCHAR,
    product_slug VARCHAR,
    product_price VARCHAR,
    thumbnail_image TEXT,
    product_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as hotspot_id,
        h.position_x,
        h.position_y,
        h.display_order,
        COALESCE(h.label, p.name, a.name)::VARCHAR as product_name,
        COALESCE(p.slug, a.slug)::VARCHAR as product_slug,
        COALESCE(p.price::TEXT, a.price) as product_price,
        COALESCE(p.images[1], a.images[1]) as thumbnail_image,
        CASE 
            WHEN p.id IS NOT NULL THEN 'customizable'
            WHEN a.id IS NOT NULL THEN 'art'
            ELSE 'unknown'
        END::VARCHAR as product_type
    FROM room_hotspots h
    LEFT JOIN products p ON h.product_id = p.id
    LEFT JOIN art_products a ON h.art_product_id = a.id
    WHERE h.room_id = room_uuid
    AND h.is_active = true
    ORDER BY h.display_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_room_hotspots IS 'Returns all active hotspots for a specific room with product details';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT * FROM room_hotspots LIMIT 1;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'room_hotspots';

-- Check view
-- SELECT * FROM v_room_hotspots_with_products LIMIT 5;

-- Check function
-- SELECT * FROM get_room_hotspots('room-uuid-here');

