-- Seed Data: Product Reviews
-- Description: Sample customer reviews for products
-- Date: 2025-10-29
-- Note: This requires existing products and customers in the database

BEGIN;

-- ============================================
-- HELPER: Insert reviews with dynamic IDs
-- ============================================

DO $$
DECLARE
    sample_product_1 UUID;
    sample_product_2 UUID;
    sample_art_1 UUID;
    sample_customer_1 UUID;
    sample_order_1 UUID;
BEGIN
    -- Get sample products
    SELECT id INTO sample_product_1 FROM products WHERE active = true LIMIT 1 OFFSET 0;
    SELECT id INTO sample_product_2 FROM products WHERE active = true LIMIT 1 OFFSET 1;
    
    -- Get sample art products
    SELECT id INTO sample_art_1 FROM art_products WHERE status = 'active' LIMIT 1 OFFSET 0;
    
    -- Get sample customer and order
    SELECT id INTO sample_customer_1 FROM customers LIMIT 1;
    SELECT id INTO sample_order_1 FROM orders LIMIT 1;
    
    -- Only insert if we have required data
    IF sample_product_1 IS NOT NULL THEN
        -- Reviews for product 1
        INSERT INTO product_reviews (
            product_id, customer_name, customer_email, rating, title, review_text, 
            verified_purchase, helpful_count, status, customer_id, order_id
        ) VALUES
        (sample_product_1, 'Sarah Johnson', 'sarah@example.com', 5, 'Absolutely stunning!', 
         'The quality exceeded my expectations. The canvas looks amazing on my living room wall. Colors are vibrant and the frame is very well made. Highly recommend!', 
         true, 12, 'approved', sample_customer_1, sample_order_1),
        
        (sample_product_1, 'Michael Chen', 'michael@example.com', 5, 'Perfect quality', 
         'Ordered a large canvas for our office. The print quality is exceptional and it arrived well packaged. Will definitely order again!', 
         true, 8, 'approved', NULL, NULL),
        
        (sample_product_1, 'Emma Wilson', 'emma@example.com', 4, 'Great product, slight delay', 
         'Love the final product! Canvas quality is excellent. Only giving 4 stars because delivery took a bit longer than expected, but worth the wait.', 
         true, 5, 'approved', NULL, NULL),
        
        (sample_product_1, 'James Brown', 'james@example.com', 5, 'Customer for life!', 
         'This is my third order and they never disappoint. The custom sizing option is perfect for my unique space. Photo quality is crystal clear.', 
         true, 15, 'approved', NULL, NULL),
        
        (sample_product_1, 'Lisa Anderson', 'lisa@example.com', 4, 'Beautiful canvas', 
         'Really happy with the canvas print. The only minor issue was a tiny mark on the edge, but it''s not very noticeable. Overall great value!', 
         true, 3, 'approved', NULL, NULL);
        
        RAISE NOTICE 'Inserted 5 reviews for product 1';
    END IF;
    
    IF sample_product_2 IS NOT NULL THEN
        -- Reviews for product 2
        INSERT INTO product_reviews (
            product_id, customer_name, customer_email, rating, title, review_text, 
            verified_purchase, helpful_count, status
        ) VALUES
        (sample_product_2, 'David Martinez', 'david@example.com', 5, 'Exactly what I wanted', 
         'The customization process was so easy! My photo looks incredible printed on canvas. Everyone who visits asks where I got it!', 
         true, 9, 'approved'),
        
        (sample_product_2, 'Sophie Taylor', 'sophie@example.com', 5, 'Amazing gift idea', 
         'Bought this as a gift for my parents'' anniversary. They loved it! The packaging was beautiful and the quality is top-notch.', 
         true, 11, 'approved'),
        
        (sample_product_2, 'Ryan O''Connor', 'ryan@example.com', 3, 'Good but could be better', 
         'The canvas itself is nice, but I felt the colors were slightly different from what I uploaded. Still looks good though.', 
         true, 2, 'approved');
        
        RAISE NOTICE 'Inserted 3 reviews for product 2';
    END IF;
    
    IF sample_art_1 IS NOT NULL THEN
        -- Reviews for art product
        INSERT INTO product_reviews (
            art_product_id, customer_name, customer_email, rating, title, review_text, 
            verified_purchase, helpful_count, status
        ) VALUES
        (sample_art_1, 'Alexandra Green', 'alex@example.com', 5, 'Beautiful artwork!', 
         'This piece is absolutely gorgeous. The colors are rich and the quality is museum-worthy. Perfect for my bedroom!', 
         true, 7, 'approved'),
        
        (sample_art_1, 'Tom Harris', 'tom@example.com', 4, 'Very nice', 
         'Really like this print. Good quality and fast delivery. Would buy again.', 
         true, 4, 'approved');
        
        RAISE NOTICE 'Inserted 2 reviews for art product';
    END IF;
    
    -- Insert some pending reviews (for admin testing)
    IF sample_product_1 IS NOT NULL THEN
        INSERT INTO product_reviews (
            product_id, customer_name, customer_email, rating, title, review_text, 
            verified_purchase, status
        ) VALUES
        (sample_product_1, 'John Pending', 'john@example.com', 5, 'Waiting for approval', 
         'Just received my order and it looks great! Can''t wait for this review to be approved.', 
         false, 'pending');
        
        RAISE NOTICE 'Inserted 1 pending review';
    END IF;
    
END $$;

COMMIT;

-- ============================================
-- MANUAL SEED DATA (if you have specific UUIDs)
-- ============================================

-- Uncomment and replace with actual UUIDs from your database:

/*
BEGIN;

-- Clear existing reviews (optional)
-- TRUNCATE TABLE product_reviews CASCADE;

INSERT INTO product_reviews (
    product_id, 
    customer_id,
    order_id,
    customer_name, 
    customer_email, 
    rating, 
    title, 
    review_text, 
    verified_purchase, 
    helpful_count, 
    status
) VALUES
-- 5-star reviews
('product-uuid-1', 'customer-uuid-1', 'order-uuid-1', 'Sarah Johnson', 'sarah@example.com', 
 5, 'Absolutely stunning!', 
 'The quality exceeded my expectations. The canvas looks amazing on my living room wall.', 
 true, 12, 'approved'),

-- 4-star reviews
('product-uuid-1', NULL, NULL, 'Emma Wilson', 'emma@example.com', 
 4, 'Great product, slight delay', 
 'Love the final product! Canvas quality is excellent. Delivery took longer than expected.', 
 true, 5, 'approved'),

-- 3-star reviews
('product-uuid-2', NULL, NULL, 'Ryan O''Connor', 'ryan@example.com', 
 3, 'Good but could be better', 
 'The canvas is nice, but colors were slightly different from upload.', 
 true, 2, 'approved');

-- Pending review (for testing admin moderation)
INSERT INTO product_reviews (
    product_id, customer_name, customer_email, rating, title, review_text, status
) VALUES
('product-uuid-1', 'Test User', 'test@example.com', 
 5, 'Pending approval', 'This is a test review waiting for approval.', 'pending');

COMMIT;
*/

-- ============================================
-- VERIFICATION
-- ============================================

-- Count reviews by status
SELECT 
    status,
    COUNT(*) as count
FROM product_reviews
GROUP BY status;

-- Count reviews by rating
SELECT 
    rating,
    COUNT(*) as count,
    ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM product_reviews WHERE status = 'approved') * 100, 1) as percentage
FROM product_reviews
WHERE status = 'approved'
GROUP BY rating
ORDER BY rating DESC;

-- View recent approved reviews with product names
SELECT 
    item_name,
    customer_name,
    rating,
    title,
    LEFT(review_text, 50) || '...' as preview,
    verified_purchase,
    helpful_count,
    created_at
FROM v_product_reviews_with_details
ORDER BY created_at DESC
LIMIT 10;

-- Check if product average ratings were updated
SELECT 
    p.name,
    p.average_rating,
    p.review_count
FROM products p
WHERE p.review_count > 0
ORDER BY p.average_rating DESC;

-- Test helper functions (replace UUID)
-- SELECT * FROM get_product_reviews('product-uuid-here', 5, 0);
-- SELECT * FROM get_rating_distribution('product-uuid-here');

