-- Seed Data: Room Hotspots
-- Description: Sample hotspots for room inspiration images
-- Date: 2025-10-29
-- Note: This requires existing rooms and products in the database

BEGIN;

-- ============================================
-- HELPER: Get sample IDs
-- ============================================

-- Get first room ID
DO $$
DECLARE
    sample_room_id UUID;
    sample_product_1 UUID;
    sample_product_2 UUID;
    sample_product_3 UUID;
    sample_art_1 UUID;
    sample_art_2 UUID;
BEGIN
    -- Get first room
    SELECT id INTO sample_room_id FROM rooms LIMIT 1;
    
    -- Get sample products
    SELECT id INTO sample_product_1 FROM products WHERE active = true LIMIT 1 OFFSET 0;
    SELECT id INTO sample_product_2 FROM products WHERE active = true LIMIT 1 OFFSET 1;
    SELECT id INTO sample_product_3 FROM products WHERE active = true LIMIT 1 OFFSET 2;
    
    -- Get sample art products
    SELECT id INTO sample_art_1 FROM art_products WHERE status = 'active' LIMIT 1 OFFSET 0;
    SELECT id INTO sample_art_2 FROM art_products WHERE status = 'active' LIMIT 1 OFFSET 1;
    
    -- Only insert if we have required data
    IF sample_room_id IS NOT NULL AND 
       (sample_product_1 IS NOT NULL OR sample_art_1 IS NOT NULL) THEN
        
        -- Insert hotspots for first room
        IF sample_product_1 IS NOT NULL THEN
            INSERT INTO room_hotspots (room_id, product_id, position_x, position_y, display_order)
            VALUES (sample_room_id, sample_product_1, 25.5, 35.0, 1);
        END IF;
        
        IF sample_product_2 IS NOT NULL THEN
            INSERT INTO room_hotspots (room_id, product_id, position_x, position_y, display_order)
            VALUES (sample_room_id, sample_product_2, 65.0, 50.0, 2);
        END IF;
        
        IF sample_art_1 IS NOT NULL THEN
            INSERT INTO room_hotspots (room_id, art_product_id, position_x, position_y, display_order, label)
            VALUES (sample_room_id, sample_art_1, 45.0, 30.0, 3, 'Featured Art');
        END IF;
        
        IF sample_product_3 IS NOT NULL THEN
            INSERT INTO room_hotspots (room_id, product_id, position_x, position_y, display_order)
            VALUES (sample_room_id, sample_product_3, 80.0, 65.0, 4);
        END IF;
        
        IF sample_art_2 IS NOT NULL THEN
            INSERT INTO room_hotspots (room_id, art_product_id, position_x, position_y, display_order)
            VALUES (sample_room_id, sample_art_2, 15.0, 60.0, 5);
        END IF;
        
        RAISE NOTICE 'Inserted hotspots for room: %', sample_room_id;
    ELSE
        RAISE NOTICE 'Skipping hotspot insertion - no rooms or products found';
    END IF;
END $$;

COMMIT;

-- ============================================
-- MANUAL SEED DATA (if you have specific UUIDs)
-- ============================================

-- Uncomment and replace with actual UUIDs from your database:

/*
BEGIN;

-- Clear existing hotspots (optional)
-- TRUNCATE TABLE room_hotspots CASCADE;

-- Room 1: Modern Living Room
-- Replace 'room-uuid-1' with actual room UUID
INSERT INTO room_hotspots (room_id, product_id, position_x, position_y, display_order, label) VALUES
('room-uuid-1', 'product-uuid-1', 25.5, 35.0, 1, NULL),
('room-uuid-1', 'product-uuid-2', 65.0, 50.0, 2, 'Large Canvas'),
('room-uuid-1', 'product-uuid-3', 80.0, 65.0, 3, NULL);

-- Room 2: Cozy Bedroom
-- Replace 'room-uuid-2' with actual room UUID
INSERT INTO room_hotspots (room_id, art_product_id, position_x, position_y, display_order) VALUES
('room-uuid-2', 'art-uuid-1', 45.0, 30.0, 1),
('room-uuid-2', 'art-uuid-2', 70.0, 40.0, 2);

-- Room 3: Home Office
-- Replace 'room-uuid-3' with actual room UUID
INSERT INTO room_hotspots (room_id, product_id, position_x, position_y, display_order) VALUES
('room-uuid-3', 'product-uuid-4', 30.0, 25.0, 1),
('room-uuid-3', 'product-uuid-5', 50.0, 35.0, 2),
('room-uuid-3', 'product-uuid-6', 70.0, 30.0, 3),
('room-uuid-3', 'product-uuid-7', 85.0, 60.0, 4);

COMMIT;
*/

-- ============================================
-- VERIFICATION
-- ============================================

-- Count hotspots per room
SELECT 
    r.title as room_name,
    COUNT(h.id) as hotspot_count
FROM rooms r
LEFT JOIN room_hotspots h ON r.id = h.room_id
GROUP BY r.id, r.title
ORDER BY hotspot_count DESC;

-- View hotspots with product details
SELECT 
    r.title as room,
    display_order,
    display_name,
    product_type,
    position_x || '%, ' || position_y || '%' as position
FROM v_room_hotspots_with_products h
JOIN rooms r ON h.room_id = r.id
ORDER BY r.title, display_order;

-- Test helper function (replace with actual room UUID)
-- SELECT * FROM get_room_hotspots('your-room-uuid-here');

