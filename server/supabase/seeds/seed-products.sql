-- Seed Data for Products with Product Types
-- Description: Sample products with different product types (canvas, framed_canvas, metal_print)

-- Note: Make sure you've run migration 003_alter_products_config.sql first

BEGIN;

-- Clear existing products to avoid duplicate key errors
TRUNCATE TABLE products CASCADE;

-- Insert sample products with different types
-- Note: config_status is 'draft' initially, we'll update to 'active' after setting config
-- Price is per square inch
INSERT INTO products (name, slug, description, price, old_price, images, is_featured, product_type, active, config_status) VALUES
-- Canvas Products
(
  'Parallel Triplet Canvas',
  'parallel-triplet-canvas',
  'Three stunning canvas prints arranged in perfect harmony',
  0.15,
  NULL,
  ARRAY[
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'canvas',
  true,
  'draft'
),
(
  'Solo Vista Canvas',
  'solo-vista-canvas',
  'Single large canvas print perfect for any room',
  0.15,
  NULL,
  ARRAY[
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'canvas',
  true,
  'draft'
),

-- Framed Canvas Products
(
  'Timeless Quartet Framed',
  'timeless-quartet-framed',
  'Four elegant framed canvas prints',
  0.25,
  0.30,
  ARRAY[
    'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'framed_canvas',
  true,
  'draft'
),
(
  'Classic Trio Framed',
  'classic-trio-framed',
  'Three beautifully framed canvas prints',
  0.25,
  0.28,
  ARRAY[
    'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'framed_canvas',
  true,
  'draft'
),

-- Metal Print Products
(
  'Modern Metal Harmony',
  'modern-metal-harmony',
  'Sleek metal print with contemporary design',
  0.35,
  0.45,
  ARRAY[
    'https://images.unsplash.com/photo-1560036040-7c5ce74043ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'metal_print',
  true,
  'draft'
),
(
  'Dual Metal Harmony',
  'dual-metal-harmony',
  'Two stunning metal prints side by side',
  0.35,
  0.40,
  ARRAY[
    'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'metal_print',
  true,
  'draft'
),

-- Additional Canvas Products (not featured)
(
  'Abstract Vision Canvas',
  'abstract-vision-canvas',
  'Bold abstract canvas print',
  0.15,
  NULL,
  ARRAY[
    'https://images.unsplash.com/photo-1560036040-7c5ce74043ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  false,
  'canvas',
  true,
  'draft'
),
(
  'Nature Serenity Canvas',
  'nature-serenity-canvas',
  'Peaceful nature scene on canvas',
  0.15,
  0.18,
  ARRAY[
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  false,
  'canvas',
  true,
  'draft'
);

-- Update config for active products (example configurations)
UPDATE products 
SET config = jsonb_build_object(
  'material', 'premium_canvas',
  'finish', 'matte',
  'mounting', 'gallery_wrap',
  'sizes', jsonb_build_array(
    jsonb_build_object('size', '8x10', 'price', 49.00),
    jsonb_build_object('size', '12x16', 'price', 69.00),
    jsonb_build_object('size', '16x20', 'price', 89.00)
  )
)
WHERE product_type = 'canvas' AND config_status = 'active';

UPDATE products 
SET config = jsonb_build_object(
  'material', 'premium_canvas',
  'finish', 'matte',
  'frame_style', 'modern_black',
  'mounting', 'ready_to_hang',
  'sizes', jsonb_build_array(
    jsonb_build_object('size', '8x10', 'price', 79.00),
    jsonb_build_object('size', '12x16', 'price', 106.00),
    jsonb_build_object('size', '16x20', 'price', 139.00)
  )
)
WHERE product_type = 'framed_canvas' AND config_status = 'active';

UPDATE products 
SET config = jsonb_build_object(
  'material', 'aluminum',
  'finish', 'glossy',
  'mounting', 'float_mount',
  'sizes', jsonb_build_array(
    jsonb_build_object('size', '8x10', 'price', 99.00),
    jsonb_build_object('size', '12x16', 'price', 149.00),
    jsonb_build_object('size', '16x20', 'price', 199.00)
  )
)
WHERE product_type = 'metal_print' AND config_status = 'active';

-- ============================================
-- SEED CATEGORIES
-- ============================================

-- Insert categories if they don't exist
INSERT INTO categories (name, slug, description, icon) VALUES
('Canvas Prints', 'canvas', 'High-quality canvas prints for your walls', '🖼️'),
('Framed Prints', 'framed-prints', 'Beautifully framed photo prints', '🖼️'),
('Metal Prints', 'metal-prints', 'Modern metal photo prints', '✨'),
('Collages', 'collage', 'Creative photo collages', '📸'),
('Wall Art', 'wall-art', 'Stunning wall art pieces', '🎨'),
('Home Decor', 'home-decor', 'Beautiful home decoration items', '🏠')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ASSIGN CATEGORIES TO PRODUCTS
-- ============================================

-- Canvas products get Canvas Prints and Wall Art categories
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
CROSS JOIN categories c
WHERE p.product_type = 'canvas' 
  AND c.slug IN ('canvas', 'wall-art')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Framed canvas products get Framed Prints, Wall Art, and Home Decor categories
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
CROSS JOIN categories c
WHERE p.product_type = 'framed_canvas' 
  AND c.slug IN ('framed-prints', 'wall-art', 'home-decor')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Metal print products get Metal Prints, Wall Art, and Home Decor categories
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
CROSS JOIN categories c
WHERE p.product_type = 'metal_print' 
  AND c.slug IN ('metal-prints', 'wall-art', 'home-decor')
ON CONFLICT (product_id, category_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View products with their categories
SELECT 
  p.name as product_name,
  p.product_type,
  p.price,
  p.is_featured,
  array_agg(c.name) as categories
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
GROUP BY p.id, p.name, p.product_type, p.price, p.is_featured
ORDER BY p.is_featured DESC, p.product_type, p.name;

-- Product summary by type
SELECT 
  product_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
  COUNT(*) FILTER (WHERE active = true) as active_count
FROM products
GROUP BY product_type
ORDER BY product_type;

-- Category summary with product counts
SELECT 
  c.name as category_name,
  c.slug,
  COUNT(pc.product_id) as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.category_id
GROUP BY c.id, c.name, c.slug
ORDER BY product_count DESC, c.name;

