-- Seed Data: Site Settings
-- Description: Default site configuration settings
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- INSERT DEFAULT SITE SETTINGS
-- ============================================

-- Clear existing settings (optional - remove in production)
-- TRUNCATE TABLE site_settings CASCADE;

-- ============================================
-- SHIPPING SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('shipping_flat_rate', '{"value": 4.99, "currency": "GBP"}'::JSONB, 'json', 'shipping', 'Flat rate shipping cost', true),
('shipping_free_threshold', '{"value": 100, "currency": "GBP"}'::JSONB, 'json', 'shipping', 'Minimum order value for free shipping', true),
('shipping_countries', '["UK", "US", "CA", "AU", "EU"]'::JSONB, 'json', 'shipping', 'Countries available for shipping', true),
('shipping_default_days', '{"value": 7}'::JSONB, 'json', 'shipping', 'Default estimated delivery days', true),
('shipping_express_available', '{"value": true}'::JSONB, 'boolean', 'shipping', 'Enable express shipping option', false),
('shipping_express_cost', '{"value": 6.99, "currency": "GBP"}'::JSONB, 'json', 'shipping', 'Express shipping cost', false);

-- ============================================
-- PAYMENT SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('payment_currency', '{"value": "GBP"}'::JSONB, 'text', 'payment', 'Default currency', true),
('payment_tax_rate', '{"value": 0.20}'::JSONB, 'number', 'payment', 'Tax rate (e.g., 0.20 for 20% VAT)', false),
('payment_tax_included', '{"value": true}'::JSONB, 'boolean', 'payment', 'Whether prices include tax', true),
('payment_minimum_order', '{"value": 10, "currency": "GBP"}'::JSONB, 'json', 'payment', 'Minimum order value', true);

-- ============================================
-- GENERAL SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('site_name', '{"value": "Photify"}'::JSONB, 'text', 'general', 'Site name', true),
('site_tagline', '{"value": "Transform Your Space with Custom Wall Art"}'::JSONB, 'text', 'general', 'Site tagline', true),
('site_description', '{"value": "Create beautiful custom canvas prints, framed art, and wall decor. Design your perfect piece with our easy online tool."}'::JSONB, 'text', 'general', 'Site description for SEO', true),
('maintenance_mode', '{"value": false}'::JSONB, 'boolean', 'general', 'Enable maintenance mode', false),
('allow_guest_checkout', '{"value": true}'::JSONB, 'boolean', 'general', 'Allow checkout without account', true),
('max_cart_items', '{"value": 50}'::JSONB, 'number', 'general', 'Maximum items allowed in cart', true);

-- ============================================
-- CONTACT & SUPPORT SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('contact_email', '{"value": "support@photify.com"}'::JSONB, 'email', 'contact', 'Customer support email', true),
('contact_phone', '{"value": "+44 20 1234 5678"}'::JSONB, 'text', 'contact', 'Customer support phone', true),
('contact_address', '{"street": "123 Print Street", "city": "London", "postcode": "W1A 1AA", "country": "United Kingdom"}'::JSONB, 'json', 'contact', 'Company address', true),
('support_hours', '{"value": "Monday-Friday, 9am-6pm GMT"}'::JSONB, 'text', 'contact', 'Support hours', true);

-- ============================================
-- EMAIL SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('email_from_name', '{"value": "Photify Team"}'::JSONB, 'text', 'email', 'Sender name for emails', false),
('email_from_address', '{"value": "noreply@photify.com"}'::JSONB, 'email', 'email', 'Sender email address', false),
('email_order_confirmation', '{"value": true}'::JSONB, 'boolean', 'email', 'Send order confirmation emails', false),
('email_shipping_notification', '{"value": true}'::JSONB, 'boolean', 'email', 'Send shipping notification emails', false),
('email_marketing_enabled', '{"value": true}'::JSONB, 'boolean', 'email', 'Enable marketing emails', false);

-- ============================================
-- SOCIAL MEDIA SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('social_facebook', '{"value": "https://facebook.com/photify"}'::JSONB, 'text', 'social', 'Facebook page URL', true),
('social_instagram', '{"value": "https://instagram.com/photify"}'::JSONB, 'text', 'social', 'Instagram profile URL', true),
('social_twitter', '{"value": "https://twitter.com/photify"}'::JSONB, 'text', 'social', 'Twitter profile URL', true),
('social_pinterest', '{"value": "https://pinterest.com/photify"}'::JSONB, 'text', 'social', 'Pinterest profile URL', true),
('social_sharing_enabled', '{"value": true}'::JSONB, 'boolean', 'social', 'Enable social sharing buttons', true);

-- ============================================
-- PRODUCT SETTINGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('product_default_price_per_sqin', '{"value": 0.25, "currency": "GBP"}'::JSONB, 'json', 'product', 'Default price per square inch for canvas', false),
('product_min_dimensions', '{"width": 8, "height": 8, "unit": "inches"}'::JSONB, 'json', 'product', 'Minimum product dimensions', true),
('product_max_dimensions', '{"width": 60, "height": 60, "unit": "inches"}'::JSONB, 'json', 'product', 'Maximum product dimensions', true),
('product_reviews_enabled', '{"value": false}'::JSONB, 'boolean', 'product', 'Enable product reviews (future feature)', true),
('product_wishlist_enabled', '{"value": false}'::JSONB, 'boolean', 'product', 'Enable wishlist feature (future)', true);

-- ============================================
-- FEATURE FLAGS
-- ============================================

INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('feature_ai_tools', '{"value": true}'::JSONB, 'boolean', 'features', 'Enable AI tools section', true),
('feature_room_inspiration', '{"value": true}'::JSONB, 'boolean', 'features', 'Enable room inspiration feature', true),
('feature_art_collection', '{"value": true}'::JSONB, 'boolean', 'features', 'Enable art collection', true),
('feature_bulk_orders', '{"value": false}'::JSONB, 'boolean', 'features', 'Enable bulk order requests', false),
('feature_gift_cards', '{"value": false}'::JSONB, 'boolean', 'features', 'Enable gift cards (future)', true);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- View all settings by category
SELECT 
    category,
    COUNT(*) as setting_count
FROM site_settings
GROUP BY category
ORDER BY category;

-- View public settings (what customers see)
SELECT 
    setting_key,
    setting_value,
    category,
    description
FROM site_settings
WHERE is_public = true
ORDER BY category, setting_key;

-- Test helper functions
SELECT get_setting('shipping_flat_rate');
SELECT get_setting('nonexistent_key', '{"default": "value"}'::JSONB);

-- View settings by category
SELECT * FROM v_settings_by_category WHERE category = 'shipping';

-- Test setting a value
-- SELECT set_setting('test_setting', '{"test": "value"}'::JSONB, 'json', 'general', 'Test description', false);

