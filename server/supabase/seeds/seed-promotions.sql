-- Seed Data: Promotions
-- Description: Sample promotional discount codes for testing
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- INSERT SAMPLE PROMOTIONS
-- ============================================

-- Clear existing promotions (optional - remove in production)
-- TRUNCATE TABLE promotions CASCADE;

-- Active Promotions
INSERT INTO promotions (code, description, type, value, min_order, max_uses, used_count, start_date, end_date, is_active, categories, first_order_only) VALUES
('SAVE20', '20% off all orders', 'percentage', 20, 50, 100, 47, '2025-10-01', '2025-12-31', true, ARRAY['all'], false),
('FREESHIP', 'Free shipping on orders over £75', 'free_shipping', 0, 75, 500, 234, '2025-10-01', '2025-12-31', true, ARRAY['all'], false),
('WELCOME15', '15% off for new customers', 'percentage', 15, 0, 1000, 156, '2025-10-01', '2025-12-31', true, ARRAY['all'], true),
('CANVAS10', '£10 off canvas prints', 'fixed_amount', 10, 30, 200, 89, '2025-10-15', '2025-11-30', true, ARRAY['custom-frames', 'canvas-prints'], false),
('ARTLOVER', '25% off art collection', 'percentage', 25, 40, 150, 67, '2025-10-20', '2025-11-20', true, ARRAY['art-collection'], false);

-- Expired Promotions (for testing)
INSERT INTO promotions (code, description, type, value, min_order, max_uses, used_count, start_date, end_date, is_active, categories, first_order_only) VALUES
('FLASH10', '£10 off your order', 'fixed_amount', 10, 30, 50, 50, '2025-10-15', '2025-10-20', false, ARRAY['all'], false),
('SUMMER25', '25% off summer sale', 'percentage', 25, 0, 300, 298, '2025-06-01', '2025-08-31', false, ARRAY['all'], false);

-- Future Promotions (for testing)
INSERT INTO promotions (code, description, type, value, min_order, max_uses, used_count, start_date, end_date, is_active, categories, first_order_only) VALUES
('XMAS30', '30% off Christmas sale', 'percentage', 30, 0, NULL, 0, '2025-12-01', '2025-12-25', true, ARRAY['all'], false),
('NEWYEAR2026', 'New Year special - £15 off', 'fixed_amount', 15, 50, 500, 0, '2026-01-01', '2026-01-15', true, ARRAY['all'], false);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check inserted promotions
SELECT 
    code,
    description,
    type,
    value,
    min_order,
    CONCAT(used_count, '/', COALESCE(max_uses::TEXT, '∞')) as usage,
    CASE 
        WHEN end_date < CURRENT_DATE THEN 'Expired'
        WHEN start_date > CURRENT_DATE THEN 'Future'
        WHEN is_active = false THEN 'Inactive'
        ELSE 'Active'
    END as status
FROM promotions
ORDER BY start_date DESC;

-- Test validation function with sample promotion
SELECT * FROM is_promotion_valid('SAVE20', 100.00, ARRAY['all']);
SELECT * FROM is_promotion_valid('FREESHIP', 80.00, ARRAY['all']);
SELECT * FROM is_promotion_valid('WELCOME15', 30.00, ARRAY['all']);

-- Count promotions by status
SELECT 
    CASE 
        WHEN end_date < CURRENT_DATE THEN 'Expired'
        WHEN start_date > CURRENT_DATE THEN 'Future'
        WHEN is_active = false THEN 'Inactive'
        ELSE 'Active'
    END as status,
    COUNT(*) as count
FROM promotions
GROUP BY status;

