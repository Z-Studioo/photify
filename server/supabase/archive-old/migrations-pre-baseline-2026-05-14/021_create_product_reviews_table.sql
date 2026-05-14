-- Migration: Create Product Reviews Table
-- Version: 021
-- Description: Create product_reviews table for customer reviews and ratings
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- CREATE PRODUCT_REVIEWS TABLE
-- ============================================

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS product_reviews CASCADE;

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    art_product_id UUID REFERENCES art_products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_response TEXT,
    admin_responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT review_has_product CHECK (
        product_id IS NOT NULL OR art_product_id IS NOT NULL
    )
);

-- ============================================
-- ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_art_product_id ON product_reviews(art_product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE product_reviews IS 'Customer reviews and ratings for products';
COMMENT ON COLUMN product_reviews.product_id IS 'Reference to customizable products';
COMMENT ON COLUMN product_reviews.art_product_id IS 'Reference to art collection products';
COMMENT ON COLUMN product_reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'True if customer actually purchased this product';
COMMENT ON COLUMN product_reviews.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN product_reviews.status IS 'Moderation status: pending, approved, or rejected';

-- ============================================
-- ADD TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;

CREATE TRIGGER update_product_reviews_updated_at 
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update for regular products
    IF NEW.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3, 2)
                FROM product_reviews
                WHERE product_id = NEW.product_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM product_reviews
                WHERE product_id = NEW.product_id
                AND status = 'approved'
            )
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on insert and update
DROP TRIGGER IF EXISTS trigger_update_product_rating_insert ON product_reviews;
DROP TRIGGER IF EXISTS trigger_update_product_rating_update ON product_reviews;

CREATE TRIGGER trigger_update_product_rating_insert
    AFTER INSERT ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER trigger_update_product_rating_update
    AFTER UPDATE ON product_reviews
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating)
    EXECUTE FUNCTION update_product_rating();

-- Trigger on delete to update rating
CREATE OR REPLACE FUNCTION update_product_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update for regular products
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3, 2)
                FROM product_reviews
                WHERE product_id = OLD.product_id
                AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM product_reviews
                WHERE product_id = OLD.product_id
                AND status = 'approved'
            )
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating_delete ON product_reviews;

CREATE TRIGGER trigger_update_product_rating_delete
    AFTER DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_on_delete();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Customers can update own pending reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admins manage reviews" ON product_reviews;

-- Public can read approved reviews
CREATE POLICY "Public read approved reviews" 
    ON product_reviews FOR SELECT 
    USING (status = 'approved');

-- Customers can insert their own reviews
CREATE POLICY "Customers can create reviews" 
    ON product_reviews FOR INSERT 
    WITH CHECK (true); -- Validation handled by application

-- Customers can update their own pending reviews
CREATE POLICY "Customers can update own pending reviews" 
    ON product_reviews FOR UPDATE 
    USING (status = 'pending' AND customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Authenticated users (admins) can do everything
CREATE POLICY "Admins manage reviews" 
    ON product_reviews FOR ALL 
    USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER VIEW: Reviews with Product Details
-- ============================================

CREATE OR REPLACE VIEW v_product_reviews_with_details AS
SELECT 
    r.id,
    r.rating,
    r.title,
    r.review_text,
    r.customer_name,
    r.verified_purchase,
    r.helpful_count,
    r.status,
    r.admin_response,
    r.created_at,
    -- Product details
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    -- Art product details
    a.id as art_product_id,
    a.name as art_product_name,
    a.slug as art_product_slug,
    -- Combined fields
    COALESCE(p.name, a.name) as item_name,
    COALESCE(p.slug, a.slug) as item_slug
FROM product_reviews r
LEFT JOIN products p ON r.product_id = p.id
LEFT JOIN art_products a ON r.art_product_id = a.id
WHERE r.status = 'approved'
ORDER BY r.created_at DESC;

COMMENT ON VIEW v_product_reviews_with_details IS 'Approved reviews with full product details';

-- ============================================
-- HELPER FUNCTION: Get reviews for product
-- ============================================

CREATE OR REPLACE FUNCTION get_product_reviews(
    product_uuid UUID,
    limit_count INTEGER DEFAULT 10,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    review_id UUID,
    rating INTEGER,
    title VARCHAR,
    review_text TEXT,
    customer_name VARCHAR,
    verified_purchase BOOLEAN,
    helpful_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as review_id,
        r.rating,
        r.title,
        r.review_text,
        r.customer_name,
        r.verified_purchase,
        r.helpful_count,
        r.created_at
    FROM product_reviews r
    WHERE (r.product_id = product_uuid OR r.art_product_id = product_uuid)
    AND r.status = 'approved'
    ORDER BY r.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_product_reviews IS 'Returns approved reviews for a specific product';

-- ============================================
-- HELPER FUNCTION: Get rating distribution
-- ============================================

CREATE OR REPLACE FUNCTION get_rating_distribution(product_uuid UUID)
RETURNS TABLE(
    rating INTEGER,
    count BIGINT,
    percentage DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH rating_counts AS (
        SELECT 
            r.rating,
            COUNT(*) as count
        FROM product_reviews r
        WHERE (r.product_id = product_uuid OR r.art_product_id = product_uuid)
        AND r.status = 'approved'
        GROUP BY r.rating
    ),
    total AS (
        SELECT SUM(count) as total_reviews FROM rating_counts
    )
    SELECT 
        rc.rating,
        rc.count,
        CASE 
            WHEN t.total_reviews > 0 THEN (rc.count::DECIMAL / t.total_reviews * 100)
            ELSE 0
        END as percentage
    FROM rating_counts rc
    CROSS JOIN total t
    ORDER BY rc.rating DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_rating_distribution IS 'Returns rating distribution (1-5 stars) for a product';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT * FROM product_reviews LIMIT 1;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'product_reviews';

-- Check view
-- SELECT * FROM v_product_reviews_with_details LIMIT 5;

-- Test helper functions
-- SELECT * FROM get_product_reviews('product-uuid-here', 5, 0);
-- SELECT * FROM get_rating_distribution('product-uuid-here');

