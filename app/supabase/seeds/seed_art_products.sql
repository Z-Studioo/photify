-- Seed Art Products with Complete Data
-- This creates realistic art products with all new fields populated
-- Run this in Supabase SQL Editor after migration 016

BEGIN;

-- ============================================
-- Clear existing art products data
-- ============================================
TRUNCATE TABLE art_products RESTART IDENTITY CASCADE;

-- ============================================
-- Get aspect ratio IDs for reference
-- ============================================
-- We'll use these UUIDs in the seed data
-- Make sure to replace with your actual aspect ratio IDs

-- First, let's insert the art products with proper UUIDs
-- We'll use gen_random_uuid() for IDs

-- ============================================
-- Insert Art Products with Complete Data
-- ============================================

-- Product 1: Ocean Dreams (Abstract, Square)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  customization_product_id,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  aspect_ratio_id,
  available_sizes,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Ocean Dreams',
  'ocean-dreams',
  'Beautiful abstract art inspired by ocean waves and movements. This stunning piece captures the essence of the sea with flowing blues and aqua tones that bring tranquility to any space.',
  'Abstract',
  '£68.00',
  ARRAY[
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
    'https://images.unsplash.com/photo-1549887534-1541e9326642',
    'https://images.unsplash.com/photo-1533158326339-7f3cf2404354'
  ],
  'Canvas',
  NULL, -- No customization for now
  false,
  'Ocean Dreams Abstract Art Print | Modern Wall Art | Photify',
  'Stunning abstract ocean-inspired art print. Available in multiple sizes. Premium quality canvas prints with vibrant colors. Perfect for modern interiors.',
  ARRAY['abstract art', 'ocean art', 'blue art', 'modern wall art', 'canvas print'],
  ARRAY['Museum-quality printing', 'Fade-resistant inks', 'Ready to hang', 'Free shipping on orders over £50']::jsonb,
  ARRAY[
    '{"label": "Material", "value": "Premium Canvas"}',
    '{"label": "Finish", "value": "Matte"}',
    '{"label": "Frame", "value": "Not Included"}',
    '{"label": "Orientation", "value": "Square"}'
  ]::jsonb,
  (SELECT id FROM aspect_ratios WHERE ratio = '1:1' LIMIT 1),
  ARRAY[
    '{"size_id": null, "price": 49.99, "image_index": 0}',
    '{"size_id": null, "price": 68.00, "image_index": 0}',
    '{"size_id": null, "price": 89.99, "image_index": 1}'
  ]::jsonb,
  50,
  'active',
  true
);

-- Product 2: Sunset Waves (Abstract, Landscape)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Sunset Waves',
  'sunset-waves',
  'Vibrant sunset colors captured in abstract wave patterns. Warm oranges, pinks, and purples create a dynamic and energizing atmosphere.',
  'Abstract',
  '£82.00',
  ARRAY[
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1'
  ],
  'Canvas',
  false,
  'Sunset Waves Abstract Art | Vibrant Wall Decor | Photify',
  'Eye-catching abstract sunset art with warm colors. Premium canvas prints available in multiple sizes. Add warmth to your living space.',
  ARRAY['sunset art', 'abstract waves', 'orange art', 'vibrant wall art'],
  ARRAY['Archival quality', 'UV-resistant', 'Sustainably sourced', 'Hand-stretched canvas']::jsonb,
  ARRAY[
    '{"label": "Material", "value": "Canvas"}',
    '{"label": "Finish", "value": "Glossy"}',
    '{"label": "Colors", "value": "Orange, Pink, Purple"}'
  ]::jsonb,
  35,
  'active',
  false
);

-- Product 3: Color Burst (Abstract, Square)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Color Burst',
  'color-burst',
  'Explosive colors creating dynamic visual impact. A bold statement piece featuring vibrant reds, yellows, and blues in an energetic composition.',
  'Abstract',
  '£56.00',
  ARRAY[
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
    'https://images.unsplash.com/photo-1525909002-1b05e0c869d8'
  ],
  'Canvas',
  false,
  'Color Burst Abstract Art Print | Bold Wall Art | Photify',
  'Bold and vibrant abstract art with explosive colors. Perfect statement piece for modern homes and offices. High-quality canvas prints.',
  ARRAY['colorful art', 'bold art', 'modern abstract', 'statement piece'],
  ARRAY['Gallery-wrapped', 'Staple-free edges', 'Premium cotton canvas', 'Eco-friendly inks']::jsonb,
  ARRAY[
    '{"label": "Style", "value": "Contemporary Abstract"}',
    '{"label": "Color Palette", "value": "Multi-color"}',
    '{"label": "Texture", "value": "Smooth Canvas"}'
  ]::jsonb,
  42,
  'active',
  true
);

-- Product 4: Divine Light (Religion, Portrait)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Divine Light',
  'divine-light',
  'Spiritual artwork depicting divine illumination. A serene and contemplative piece that brings peace and reflection to any sacred space.',
  'Religion',
  '£88.00',
  ARRAY[
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
  ],
  'Framed Print',
  false,
  'Divine Light Religious Art | Spiritual Wall Decor | Photify',
  'Beautiful spiritual art depicting divine light. Perfect for meditation spaces and places of worship. Available with premium framing options.',
  ARRAY['religious art', 'spiritual decor', 'divine art', 'meditation art'],
  ARRAY['Framed option available', 'Acid-free paper', 'Archival quality', 'Blessed creation']::jsonb,
  ARRAY[
    '{"label": "Theme", "value": "Spiritual"}',
    '{"label": "Mood", "value": "Peaceful"}',
    '{"label": "Frame", "value": "Optional"}'
  ]::jsonb,
  28,
  'active',
  true
);

-- Product 5: Wild Lion (Animals, Square)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Wild Lion',
  'wild-lion',
  'Majestic lion portrait capturing raw power and beauty. A stunning wildlife photograph that brings the majesty of nature into your home.',
  'Animals',
  '£92.00',
  ARRAY[
    'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0'
  ],
  'Canvas',
  false,
  'Wild Lion Portrait | Wildlife Art Print | Photify',
  'Majestic lion wildlife art. Professional photography printed on premium canvas. Bold statement piece for nature lovers.',
  ARRAY['lion art', 'wildlife photography', 'animal art', 'nature decor'],
  ARRAY['Professional photography', 'Sharp details', 'Natural colors', 'Large format available']::jsonb,
  ARRAY[
    '{"label": "Subject", "value": "African Lion"}',
    '{"label": "Photography", "value": "Professional"}',
    '{"label": "Print Type", "value": "Canvas"}'
  ]::jsonb,
  31,
  'active',
  true
);

-- Product 6: Himalayan Peaks (Nepal, Landscape)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Himalayan Peaks',
  'himalayan-peaks',
  'Stunning mountain landscape from the Himalayas. Breathtaking views of snow-capped peaks that inspire adventure and tranquility.',
  'Nepal',
  '£105.00',
  ARRAY[
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e'
  ],
  'Canvas',
  false,
  'Himalayan Peaks Landscape Art | Nepal Mountain Print | Photify',
  'Breathtaking Himalayan mountain landscape. Professional photography of Nepal''s majestic peaks. Premium quality prints for adventure lovers.',
  ARRAY['himalayan art', 'mountain landscape', 'nepal art', 'adventure decor'],
  ARRAY['High-resolution print', 'Landscape orientation', 'Weather-resistant coating', 'Panoramic available']::jsonb,
  ARRAY[
    '{"label": "Location", "value": "Nepal Himalayas"}',
    '{"label": "Season", "value": "Winter"}',
    '{"label": "View", "value": "Panoramic"}'
  ]::jsonb,
  22,
  'active',
  true
);

-- Product 7: Modern Geometry (Abstract, Square) - T-shirt variant
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Modern Geometry',
  'modern-geometry',
  'Contemporary geometric abstract design. Clean lines and bold shapes create a sophisticated modern aesthetic perfect for minimalist interiors.',
  'Abstract',
  '£45.00',
  ARRAY[
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85'
  ],
  'Poster',
  false,
  'Modern Geometry Abstract Poster | Minimalist Wall Art | Photify',
  'Sleek geometric abstract design. Perfect for modern and minimalist interiors. High-quality poster print with crisp lines.',
  ARRAY['geometric art', 'minimalist art', 'modern design', 'abstract geometry'],
  ARRAY['Matte finish', 'Lightweight', 'Easy to frame', 'Affordable luxury']::jsonb,
  ARRAY[
    '{"label": "Style", "value": "Minimalist"}',
    '{"label": "Type", "value": "Poster"}',
    '{"label": "Paper", "value": "Premium"}'
  ]::jsonb,
  60,
  'active',
  false
);

-- Product 8: Serene Buddha (Religion, Portrait)
INSERT INTO art_products (
  id,
  name,
  slug,
  description,
  category,
  price,
  images,
  product_type,
  allow_customization,
  meta_title,
  meta_description,
  meta_keywords,
  features,
  specifications,
  stock_quantity,
  status,
  is_bestseller
) VALUES (
  gen_random_uuid(),
  'Serene Buddha',
  'serene-buddha',
  'Peaceful Buddha meditation art. Creates a calming atmosphere perfect for yoga studios, meditation rooms, and mindful living spaces.',
  'Religion',
  '£75.00',
  ARRAY[
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9'
  ],
  'Canvas',
  false,
  'Serene Buddha Meditation Art | Peaceful Wall Decor | Photify',
  'Calming Buddha artwork for meditation and mindfulness spaces. Premium canvas print with serene imagery.',
  ARRAY['buddha art', 'meditation decor', 'zen art', 'spiritual wall art'],
  ARRAY['Meditation-focused', 'Calming tones', 'Spiritual energy', 'Peaceful presence']::jsonb,
  ARRAY[
    '{"label": "Theme", "value": "Buddhism"}',
    '{"label": "Mood", "value": "Serene"}',
    '{"label": "Use", "value": "Meditation"}'
  ]::jsonb,
  45,
  'active',
  false
);

COMMIT;

-- ============================================
-- Verification
-- ============================================
SELECT 
    name,
    product_type,
    category,
    price,
    status,
    is_bestseller,
    array_length(images, 1) as image_count,
    CASE 
        WHEN available_sizes IS NOT NULL THEN jsonb_array_length(available_sizes)
        ELSE 0
    END as size_count
FROM art_products
ORDER BY created_at;

