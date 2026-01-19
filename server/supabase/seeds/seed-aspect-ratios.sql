-- Seed Data for Aspect Ratios and Sizes
-- Description: Comprehensive mockup data for testing and development

-- ============================================
-- ASPECT RATIOS - Portrait Orientations
-- ============================================
INSERT INTO aspect_ratios (label, width_ratio, height_ratio, orientation) VALUES
    ('2:3 Portrait', 2, 3, 'portrait'),
    ('3:4 Portrait', 3, 4, 'portrait'),
    ('4:5 Portrait', 4, 5, 'portrait'),
    ('5:7 Portrait', 5, 7, 'portrait'),
    ('9:16 Portrait', 9, 16, 'portrait');

-- ============================================
-- ASPECT RATIOS - Landscape Orientations
-- ============================================
INSERT INTO aspect_ratios (label, width_ratio, height_ratio, orientation) VALUES
    ('3:2 Landscape', 3, 2, 'landscape'),
    ('4:3 Landscape', 4, 3, 'landscape'),
    ('5:4 Landscape', 5, 4, 'landscape'),
    ('7:5 Landscape', 7, 5, 'landscape'),
    ('16:9 Landscape', 16, 9, 'landscape'),
    ('21:9 Ultrawide', 21, 9, 'landscape');

-- ============================================
-- ASPECT RATIOS - Square Orientation
-- ============================================
INSERT INTO aspect_ratios (label, width_ratio, height_ratio, orientation) VALUES
    ('1:1 Square', 1, 1, 'square');

-- ============================================
-- SIZES - 2:3 Portrait
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 4, 6, '4" × 6"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 5, 7, '5" × 7"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 8, 12, '8" × 12"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 10, 15, '10" × 15"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 12, 18, '12" × 18"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 16, 24, '16" × 24"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 20, 30, '20" × 30"' FROM aspect_ratios WHERE label = '2:3 Portrait'
UNION ALL
SELECT id, 24, 36, '24" × 36"' FROM aspect_ratios WHERE label = '2:3 Portrait';

-- ============================================
-- SIZES - 3:4 Portrait
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 6, 8, '6" × 8"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 9, 12, '9" × 12"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 12, 16, '12" × 16"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 15, 20, '15" × 20"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 18, 24, '18" × 24"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 24, 32, '24" × 32"' FROM aspect_ratios WHERE label = '3:4 Portrait'
UNION ALL
SELECT id, 30, 40, '30" × 40"' FROM aspect_ratios WHERE label = '3:4 Portrait';

-- ============================================
-- SIZES - 4:5 Portrait
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 4, 5, '4" × 5"' FROM aspect_ratios WHERE label = '4:5 Portrait'
UNION ALL
SELECT id, 8, 10, '8" × 10"' FROM aspect_ratios WHERE label = '4:5 Portrait'
UNION ALL
SELECT id, 11, 14, '11" × 14"' FROM aspect_ratios WHERE label = '4:5 Portrait'
UNION ALL
SELECT id, 16, 20, '16" × 20"' FROM aspect_ratios WHERE label = '4:5 Portrait'
UNION ALL
SELECT id, 20, 25, '20" × 25"' FROM aspect_ratios WHERE label = '4:5 Portrait'
UNION ALL
SELECT id, 24, 30, '24" × 30"' FROM aspect_ratios WHERE label = '4:5 Portrait';

-- ============================================
-- SIZES - 5:7 Portrait
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 5, 7, '5" × 7"' FROM aspect_ratios WHERE label = '5:7 Portrait'
UNION ALL
SELECT id, 10, 14, '10" × 14"' FROM aspect_ratios WHERE label = '5:7 Portrait'
UNION ALL
SELECT id, 15, 21, '15" × 21"' FROM aspect_ratios WHERE label = '5:7 Portrait'
UNION ALL
SELECT id, 20, 28, '20" × 28"' FROM aspect_ratios WHERE label = '5:7 Portrait';

-- ============================================
-- SIZES - 9:16 Portrait (Instagram/Mobile)
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 9, 16, '9" × 16"' FROM aspect_ratios WHERE label = '9:16 Portrait'
UNION ALL
SELECT id, 12, 21, '12" × 21"' FROM aspect_ratios WHERE label = '9:16 Portrait'
UNION ALL
SELECT id, 18, 32, '18" × 32"' FROM aspect_ratios WHERE label = '9:16 Portrait';

-- ============================================
-- SIZES - 3:2 Landscape
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 6, 4, '6" × 4"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 12, 8, '12" × 8"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 15, 10, '15" × 10"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 18, 12, '18" × 12"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 24, 16, '24" × 16"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 30, 20, '30" × 20"' FROM aspect_ratios WHERE label = '3:2 Landscape'
UNION ALL
SELECT id, 36, 24, '36" × 24"' FROM aspect_ratios WHERE label = '3:2 Landscape';

-- ============================================
-- SIZES - 4:3 Landscape
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 8, 6, '8" × 6"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 12, 9, '12" × 9"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 16, 12, '16" × 12"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 20, 15, '20" × 15"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 24, 18, '24" × 18"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 32, 24, '32" × 24"' FROM aspect_ratios WHERE label = '4:3 Landscape'
UNION ALL
SELECT id, 40, 30, '40" × 30"' FROM aspect_ratios WHERE label = '4:3 Landscape';

-- ============================================
-- SIZES - 5:4 Landscape
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 5, 4, '5" × 4"' FROM aspect_ratios WHERE label = '5:4 Landscape'
UNION ALL
SELECT id, 10, 8, '10" × 8"' FROM aspect_ratios WHERE label = '5:4 Landscape'
UNION ALL
SELECT id, 15, 12, '15" × 12"' FROM aspect_ratios WHERE label = '5:4 Landscape'
UNION ALL
SELECT id, 20, 16, '20" × 16"' FROM aspect_ratios WHERE label = '5:4 Landscape'
UNION ALL
SELECT id, 25, 20, '25" × 20"' FROM aspect_ratios WHERE label = '5:4 Landscape'
UNION ALL
SELECT id, 30, 24, '30" × 24"' FROM aspect_ratios WHERE label = '5:4 Landscape';

-- ============================================
-- SIZES - 16:9 Landscape (HD/Widescreen)
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 16, 9, '16" × 9"' FROM aspect_ratios WHERE label = '16:9 Landscape'
UNION ALL
SELECT id, 24, 14, '24" × 14"' FROM aspect_ratios WHERE label = '16:9 Landscape'
UNION ALL
SELECT id, 32, 18, '32" × 18"' FROM aspect_ratios WHERE label = '16:9 Landscape'
UNION ALL
SELECT id, 40, 22, '40" × 22"' FROM aspect_ratios WHERE label = '16:9 Landscape'
UNION ALL
SELECT id, 48, 27, '48" × 27"' FROM aspect_ratios WHERE label = '16:9 Landscape';

-- ============================================
-- SIZES - 21:9 Ultrawide
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 21, 9, '21" × 9"' FROM aspect_ratios WHERE label = '21:9 Ultrawide'
UNION ALL
SELECT id, 35, 15, '35" × 15"' FROM aspect_ratios WHERE label = '21:9 Ultrawide'
UNION ALL
SELECT id, 42, 18, '42" × 18"' FROM aspect_ratios WHERE label = '21:9 Ultrawide';

-- ============================================
-- SIZES - 1:1 Square
-- ============================================
INSERT INTO sizes (aspect_ratio_id, width_in, height_in, display_label)
SELECT id, 4, 4, '4" × 4"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 6, 6, '6" × 6"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 8, 8, '8" × 8"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 10, 10, '10" × 10"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 12, 12, '12" × 12"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 16, 16, '16" × 16"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 20, 20, '20" × 20"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 24, 24, '24" × 24"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 30, 30, '30" × 30"' FROM aspect_ratios WHERE label = '1:1 Square'
UNION ALL
SELECT id, 36, 36, '36" × 36"' FROM aspect_ratios WHERE label = '1:1 Square';

-- ============================================
-- SUMMARY QUERY
-- ============================================
-- Run this to see the summary of data inserted
SELECT 
    ar.label,
    ar.orientation,
    COUNT(s.id) as size_count,
    MIN(s.area_in2) as min_area,
    MAX(s.area_in2) as max_area
FROM aspect_ratios ar
LEFT JOIN sizes s ON ar.id = s.aspect_ratio_id
GROUP BY ar.label, ar.orientation
ORDER BY ar.orientation, ar.label;

