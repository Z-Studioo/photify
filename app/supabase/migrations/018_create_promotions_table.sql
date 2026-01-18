-- Migration: Create Promotions Table
-- Version: 018
-- Description: Create promotions table for discount codes and promotional campaigns
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- CREATE PROMOTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
    value DECIMAL(10, 2) NOT NULL DEFAULT 0, -- percentage or fixed amount
    min_order DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    categories TEXT[] DEFAULT ARRAY['all'], -- applicable categories (or ['all'])
    excluded_product_ids UUID[] DEFAULT ARRAY[]::UUID[], -- products excluded from promotion
    first_order_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE promotions IS 'Promotional discount codes and campaigns';
COMMENT ON COLUMN promotions.code IS 'Unique promotion code (e.g., SAVE20, FREESHIP)';
COMMENT ON COLUMN promotions.type IS 'Discount type: percentage, fixed_amount, or free_shipping';
COMMENT ON COLUMN promotions.value IS 'Discount value: percentage (e.g., 20 for 20%) or fixed amount (e.g., 10 for £10)';
COMMENT ON COLUMN promotions.min_order IS 'Minimum order value required to use promotion';
COMMENT ON COLUMN promotions.max_uses IS 'Maximum number of times promotion can be used (NULL = unlimited)';
COMMENT ON COLUMN promotions.used_count IS 'Number of times promotion has been used';
COMMENT ON COLUMN promotions.categories IS 'Array of category slugs or [''all''] for all categories';
COMMENT ON COLUMN promotions.excluded_product_ids IS 'Array of product IDs excluded from promotion';
COMMENT ON COLUMN promotions.first_order_only IS 'If true, only valid for customers'' first order';

-- ============================================
-- ADD TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON promotions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Public can read active promotions
CREATE POLICY "Public read active promotions" 
    ON promotions FOR SELECT 
    USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- Authenticated users (admins) can do everything
CREATE POLICY "Admins manage promotions" 
    ON promotions FOR ALL 
    USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTION: Check if promotion is valid
-- ============================================

CREATE OR REPLACE FUNCTION is_promotion_valid(
    promotion_code VARCHAR(50),
    order_total DECIMAL(10, 2),
    order_categories TEXT[] DEFAULT ARRAY['all']
)
RETURNS TABLE(
    valid BOOLEAN,
    discount_amount DECIMAL(10, 2),
    error_message TEXT
) AS $$
DECLARE
    promo RECORD;
    calculated_discount DECIMAL(10, 2);
BEGIN
    -- Find promotion
    SELECT * INTO promo
    FROM promotions
    WHERE code = promotion_code
    AND is_active = true
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;

    -- Check if promotion exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Invalid or expired promotion code';
        RETURN;
    END IF;

    -- Check if max uses reached
    IF promo.max_uses IS NOT NULL AND promo.used_count >= promo.max_uses THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promotion code has reached maximum uses';
        RETURN;
    END IF;

    -- Check minimum order value
    IF order_total < promo.min_order THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 
            'Order total must be at least £' || promo.min_order::TEXT;
        RETURN;
    END IF;

    -- Calculate discount
    CASE promo.type
        WHEN 'percentage' THEN
            calculated_discount := (order_total * promo.value / 100);
        WHEN 'fixed_amount' THEN
            calculated_discount := LEAST(promo.value, order_total); -- Can't exceed order total
        WHEN 'free_shipping' THEN
            calculated_discount := 0; -- Handled separately in checkout
        ELSE
            calculated_discount := 0;
    END CASE;

    -- Return success
    RETURN QUERY SELECT true, calculated_discount, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_promotion_valid IS 'Validates a promotion code and calculates discount amount';

-- ============================================
-- HELPER FUNCTION: Apply promotion to order
-- ============================================

CREATE OR REPLACE FUNCTION apply_promotion_to_order(
    promotion_code VARCHAR(50),
    order_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    promo_id UUID;
BEGIN
    -- Get promotion ID
    SELECT id INTO promo_id
    FROM promotions
    WHERE code = promotion_code
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Increment used count
    UPDATE promotions
    SET used_count = used_count + 1
    WHERE id = promo_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION apply_promotion_to_order IS 'Increments promotion usage count when applied to an order';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT * FROM promotions LIMIT 1;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'promotions';

-- Check functions
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%promotion%';

-- Test validation function
-- SELECT * FROM is_promotion_valid('SAVE20', 100.00, ARRAY['all']);

