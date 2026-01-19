-- Migration: Add Aspect Ratios and Sizes
-- Description: Creates tables for managing product aspect ratios and sizes

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ASPECT RATIOS TABLE
-- ============================================
CREATE TABLE aspect_ratios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    width_ratio INTEGER NOT NULL,
    height_ratio INTEGER NOT NULL,
    orientation TEXT NOT NULL CHECK (orientation IN ('portrait', 'landscape', 'square')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active aspect ratios
CREATE INDEX idx_aspect_ratios_active ON aspect_ratios(active);
CREATE INDEX idx_aspect_ratios_orientation ON aspect_ratios(orientation);

-- ============================================
-- SIZES TABLE
-- ============================================
CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aspect_ratio_id UUID NOT NULL REFERENCES aspect_ratios(id) ON DELETE CASCADE,
    width_in INTEGER NOT NULL,
    height_in INTEGER NOT NULL,
    display_label TEXT NOT NULL,
    area_in2 NUMERIC GENERATED ALWAYS AS (width_in * height_in) STORED,
    long_side_in INTEGER GENERATED ALWAYS AS (GREATEST(width_in, height_in)) STORED,
    short_side_in INTEGER GENERATED ALWAYS AS (LEAST(width_in, height_in)) STORED,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sizes
CREATE INDEX idx_sizes_aspect_ratio_id ON sizes(aspect_ratio_id);
CREATE INDEX idx_sizes_active ON sizes(active);
CREATE INDEX idx_sizes_long_side ON sizes(long_side_in);
CREATE INDEX idx_sizes_short_side ON sizes(short_side_in);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE aspect_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

-- Public read access for active aspect ratios
CREATE POLICY "Public read active aspect_ratios" ON aspect_ratios 
    FOR SELECT USING (active = true);

-- Public read access for active sizes
CREATE POLICY "Public read active sizes" ON sizes 
    FOR SELECT USING (active = true);

-- Admin policies (to be updated with proper authentication)
-- These allow all operations for now - adjust based on your auth setup
CREATE POLICY "Admin manage aspect_ratios" ON aspect_ratios 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin manage sizes" ON sizes 
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert common aspect ratios
INSERT INTO aspect_ratios (label, width_ratio, height_ratio, orientation) VALUES
    ('2:3 Portrait', 2, 3, 'portrait'),
    ('3:2 Landscape', 3, 2, 'landscape'),
    ('3:4 Portrait', 3, 4, 'portrait'),
    ('4:3 Landscape', 4, 3, 'landscape'),
    ('1:1 Square', 1, 1, 'square'),
    ('16:9 Landscape', 16, 9, 'landscape'),
    ('9:16 Portrait', 9, 16, 'portrait'),
    ('4:5 Portrait', 4, 5, 'portrait'),
    ('5:4 Landscape', 5, 4, 'landscape');

-- Insert sample sizes for 2:3 Portrait ratio
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 4, 6, '4" × 6"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 8, 12, '8" × 12"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 12, 18, '12" × 18"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 16, 24, '16" × 24"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 20, 30, '20" × 30"' FROM aspect_ratios WHERE label = '2:3 Portrait';

-- Insert sample sizes for 1:1 Square ratio
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 8, 8, '8" × 8"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 12, 12, '12" × 12"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 16, 16, '16" × 16"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 20, 20, '20" × 20"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 24, 24, '24" × 24"' FROM aspect_ratios WHERE label = '1:1 Square';

-- Insert sample sizes for 3:4 Portrait ratio
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 6, 8, '6" × 8"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 9, 12, '9" × 12"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 12, 16, '12" × 16"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 18, 24, '18" × 24"' FROM aspect_ratios WHERE label = '3:4 Portrait';

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View to get sizes with their aspect ratio information
CREATE OR REPLACE VIEW v_sizes_with_ratios AS
SELECT 
    s.id,
    s.width_in,
    s.height_in,
    s.display_label,
    s.area_in2,
    s.long_side_in,
    s.short_side_in,
    s.active,
    s.created_at,
    ar.label AS ratio_label,
    ar.width_ratio,
    ar.height_ratio,
    ar.orientation
FROM sizes s
JOIN aspect_ratios ar ON s.aspect_ratio_id = ar.id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE aspect_ratios IS 'Stores aspect ratios for product sizing (e.g., 2:3, 16:9)';
COMMENT ON TABLE sizes IS 'Specific dimensional sizes derived from aspect ratios';

COMMENT ON COLUMN sizes.area_in2 IS 'Computed area in square inches';
COMMENT ON COLUMN sizes.long_side_in IS 'Computed longest side dimension';
COMMENT ON COLUMN sizes.short_side_in IS 'Computed shortest side dimension';

