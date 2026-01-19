-- Photify Mock Data
-- Run this AFTER schema.sql

-- ============================================
-- SEED DATA
-- ============================================

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Canvas Prints', 'canvas', 'High-quality canvas prints'),
('Framed Prints', 'framed-prints', 'Beautifully framed photo prints'),
('Collages', 'collage', 'Creative photo collages'),
('Photo Cushions', 'cushions', 'Custom photo cushions'),
('Custom Frames', 'custom-frames', 'Custom picture frames'),
('Gallery Walls', 'gallery-walls', 'Complete gallery wall sets');

-- Products
INSERT INTO products (name, slug, price, old_price, size, images, category_id, is_featured, is_bestseller) VALUES
(
    'Parallel Triplet',
    'parallel-triplet',
    69.00,
    NULL,
    '74cm x 28cm',
    ARRAY[
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'collage'),
    true,
    true
),
(
    'Timeless Quartet',
    'timeless-quartet',
    106.00,
    140.00,
    '69cm x 89cm',
    ARRAY[
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?w=1080',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'framed-prints'),
    true,
    true
),
(
    'Harmony In Four',
    'harmony-in-four',
    237.00,
    318.00,
    '102cm x 119cm',
    ARRAY[
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?w=1080',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'canvas'),
    true,
    false
),
(
    'Solo Vista',
    'solo-vista',
    51.00,
    NULL,
    '51cm x 61cm',
    ARRAY[
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080',
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?w=1080',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'cushions'),
    false,
    false
),
(
    'Dual Harmony',
    'dual-harmony',
    111.00,
    144.00,
    '81cm x 31cm',
    ARRAY[
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?w=1080',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'collage'),
    false,
    true
),
(
    'Classic Trio',
    'classic-trio',
    174.00,
    216.00,
    '84cm x 52cm',
    ARRAY[
        'https://images.unsplash.com/photo-1677658288136-5e2ff2b40f07?w=1080',
        'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'framed-prints'),
    false,
    false
),
(
    'Abstract Vision',
    'abstract-vision',
    89.00,
    NULL,
    '92cm x 72cm',
    ARRAY[
        'https://images.unsplash.com/photo-1560036040-7c5ce74043ff?w=1080',
        'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?w=1080',
        'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?w=1080'
    ],
    (SELECT id FROM categories WHERE slug = 'canvas'),
    false,
    false
);

-- Art Products
INSERT INTO art_products (name, slug, image, category, price, size, is_bestseller) VALUES
-- Abstract
('Ocean Dreams', 'ocean-dreams', 'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?w=1080', 'Abstract', '£68.00', '50cm x 70cm', true),
('Sunset Waves', 'sunset-waves', 'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?w=1080', 'Abstract', '£82.00', '60cm x 80cm', false),
('Color Burst', 'color-burst', 'https://images.unsplash.com/photo-1678117699040-b89738399ca7?w=1080', 'Abstract', '£56.00', '40cm x 60cm', true),
('Fluid Motion', 'fluid-motion', 'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?w=1080', 'Abstract', '£125.00', '70cm x 100cm', false),
('Geometric Harmony', 'geometric-harmony', 'https://images.unsplash.com/photo-1744096641619-646e1f6fbcd5?w=1080', 'Abstract', '£48.00', '30cm x 40cm', false),
('Modern Lines', 'modern-lines', 'https://images.unsplash.com/photo-1678117699040-b89738399ca7?w=1080', 'Abstract', '£62.00', '45cm x 60cm', true),

-- Religion
('Divine Light', 'divine-light', 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=1080', 'Religion', '£88.00', '50cm x 70cm', true),
('Sacred Symbols', 'sacred-symbols', 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=1080', 'Religion', '£72.00', '40cm x 60cm', false),
('Spiritual Journey', 'spiritual-journey', 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=1080', 'Religion', '£115.00', '60cm x 90cm', true),
('Temple Art', 'temple-art', 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=1080', 'Religion', '£58.00', '30cm x 40cm', false),

-- Animals
('Wild Lion', 'wild-lion', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£92.00', '60cm x 80cm', true),
('Elephant Majesty', 'elephant-majesty', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£78.00', '50cm x 70cm', false),
('Bird Paradise', 'bird-paradise', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£65.00', '40cm x 60cm', true),
('Wolf Spirit', 'wolf-spirit', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£135.00', '70cm x 100cm', false),
('Deer in Forest', 'deer-in-forest', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£85.00', '55cm x 75cm', false),
('Ocean Creatures', 'ocean-creatures', 'https://images.unsplash.com/photo-1683027062130-e70ca0fbc20f?w=1080', 'Animals', '£75.00', '50cm x 70cm', false),

-- Nepal
('Himalayan Peaks', 'himalayan-peaks', 'https://images.unsplash.com/photo-1718106230088-ef0606677859?w=1080', 'Nepal', '£105.00', '60cm x 90cm', true),
('Kathmandu Valley', 'kathmandu-valley', 'https://images.unsplash.com/photo-1718106230088-ef0606677859?w=1080', 'Nepal', '£88.00', '50cm x 70cm', false),
('Prayer Flags', 'prayer-flags', 'https://images.unsplash.com/photo-1718106230088-ef0606677859?w=1080', 'Nepal', '£72.00', '40cm x 60cm', true),
('Mountain Village', 'mountain-village', 'https://images.unsplash.com/photo-1718106230088-ef0606677859?w=1080', 'Nepal', '£145.00', '70cm x 100cm', false);

-- Rooms
INSERT INTO rooms (title, slug, image, product_count, description) VALUES
('Modern Living Room', 'modern-living-room', 'https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?w=1080', 3, 'Contemporary living space with modern art'),
('Cozy Bedroom', 'cozy-bedroom', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1080', 2, 'Comfortable bedroom with wall art'),
('Elegant Dining Room', 'dining-room', 'https://images.unsplash.com/photo-1704040686487-a39bb894fc93?w=1080', 2, 'Sophisticated dining area'),
('Creative Home Office', 'home-office', 'https://images.unsplash.com/photo-1669723008642-b00fa9d10b76?w=1080', 2, 'Inspiring workspace with art');

-- AI Tools
INSERT INTO ai_tools (title, slug, description, image, path, is_active) VALUES
('Restore Image with AI', 'restore', 'Bring old photos back to life with AI-powered restoration', 'https://images.unsplash.com/photo-1512373977447-6a8a90da5f7d?w=1080', '/ai-restore', true),
('AI Photo Editor', 'editor', 'Edit your photos like a pro with intelligent AI tools', 'https://images.unsplash.com/photo-1637519290541-0a12b3185485?w=1080', '/ai-photo-editor', true),
('Photo Collage Maker', 'collage', 'Create stunning collages with our easy-to-use tool', 'https://images.unsplash.com/photo-1612681336352-b8b82f3c775a?w=1080', '/ai-collage', true),
('Background Remover', 'background', 'Remove backgrounds instantly with AI precision', 'https://images.unsplash.com/photo-1572882724878-e17d310e6a74?w=1080', '/ai-background-remover', true);

-- Print Sizes
INSERT INTO print_sizes (name, dimensions, price, is_active, display_order) VALUES
('8" × 10"', '20cm × 25cm', 29.99, true, 1),
('12" × 16"', '30cm × 40cm', 49.99, true, 2),
('18" × 24"', '45cm × 60cm', 79.99, true, 3),
('24" × 32"', '60cm × 80cm', 129.99, true, 4);

-- Sample Customers
INSERT INTO customers (email, name, phone, total_orders, total_spent) VALUES
('john.doe@example.com', 'John Doe', '+1234567890', 3, 456.00),
('jane.smith@example.com', 'Jane Smith', '+1234567891', 5, 892.50),
('bob.wilson@example.com', 'Bob Wilson', '+1234567892', 1, 106.00);

-- Sample Orders
INSERT INTO orders (order_number, customer_email, customer_name, shipping_address, status, subtotal, shipping_cost, total) VALUES
(
    'ORD-20250122-0001',
    'john.doe@example.com',
    'John Doe',
    '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'::jsonb,
    'delivered',
    106.00,
    10.00,
    116.00
),
(
    'ORD-20250122-0002',
    'jane.smith@example.com',
    'Jane Smith',
    '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90001", "country": "USA"}'::jsonb,
    'shipped',
    237.00,
    15.00,
    252.00
),
(
    'ORD-20250122-0003',
    'bob.wilson@example.com',
    'Bob Wilson',
    '{"street": "789 Pine Rd", "city": "Chicago", "state": "IL", "zip": "60601", "country": "USA"}'::jsonb,
    'processing',
    69.00,
    8.00,
    77.00
);

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, size) 
SELECT 
    o.id,
    p.id,
    p.name,
    p.images[1],
    1,
    p.price,
    p.size
FROM orders o
JOIN products p ON p.slug = 'timeless-quartet'
WHERE o.order_number = 'ORD-20250122-0001';

INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, size) 
SELECT 
    o.id,
    p.id,
    p.name,
    p.images[1],
    1,
    p.price,
    p.size
FROM orders o
JOIN products p ON p.slug = 'harmony-in-four'
WHERE o.order_number = 'ORD-20250122-0002';

INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, size) 
SELECT 
    o.id,
    p.id,
    p.name,
    p.images[1],
    1,
    p.price,
    p.size
FROM orders o
JOIN products p ON p.slug = 'parallel-triplet'
WHERE o.order_number = 'ORD-20250122-0003';

