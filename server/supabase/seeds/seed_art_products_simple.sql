-- Simple Art Products Seed Data
-- Run this in Supabase SQL Editor to create test data
-- No dependencies on aspect_ratios or sizes tables

BEGIN;

-- ============================================
-- Clear existing art products data
-- ============================================
DELETE FROM art_products;

-- ============================================
-- Insert 8 Complete Art Products
-- ============================================

INSERT INTO art_products (
  name, slug, description, category, price,
  images, product_type, allow_customization,
  meta_title, meta_description, meta_keywords,
  features, specifications, available_sizes,
  stock_quantity, status, is_bestseller
) VALUES 
-- Product 1: Ocean Dreams
(
  'Ocean Dreams',
  'ocean-dreams',
  'Beautiful abstract art inspired by ocean waves and movements. This stunning piece captures the essence of the sea with flowing blues and aqua tones.',
  'Abstract',
  '£68.00',
  ARRAY['https://images.unsplash.com/photo-1541961017774-22349e4a1262', 'https://images.unsplash.com/photo-1549887534-1541e9326642'],
  'Canvas',
  false,
  'Ocean Dreams Abstract Art Print | Photify',
  'Stunning abstract ocean-inspired art print available in multiple sizes.',
  ARRAY['abstract art', 'ocean art', 'blue art', 'canvas print'],
  '["Museum-quality printing", "Fade-resistant inks", "Ready to hang", "Free shipping"]'::jsonb,
  '[{"label": "Material", "value": "Premium Canvas"}, {"label": "Finish", "value": "Matte"}]'::jsonb,
  '[]'::jsonb,
  50,
  'active',
  true
),

-- Product 2: Sunset Waves
(
  'Sunset Waves',
  'sunset-waves',
  'Vibrant sunset colors captured in abstract wave patterns. Warm oranges, pinks, and purples create a dynamic atmosphere.',
  'Abstract',
  '£82.00',
  ARRAY['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5', 'https://images.unsplash.com/photo-1557672172-298e090bd0f1'],
  'Canvas',
  false,
  'Sunset Waves Abstract Art | Photify',
  'Eye-catching abstract sunset art with warm colors.',
  ARRAY['sunset art', 'abstract waves', 'vibrant wall art'],
  '["Archival quality", "UV-resistant", "Hand-stretched canvas"]'::jsonb,
  '[{"label": "Material", "value": "Canvas"}, {"label": "Finish", "value": "Glossy"}]'::jsonb,
  '[]'::jsonb,
  35,
  'active',
  false
),

-- Product 3: Color Burst
(
  'Color Burst',
  'color-burst',
  'Explosive colors creating dynamic visual impact. A bold statement piece featuring vibrant reds, yellows, and blues.',
  'Abstract',
  '£56.00',
  ARRAY['https://images.unsplash.com/photo-1541961017774-22349e4a1262', 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8'],
  'Canvas',
  false,
  'Color Burst Abstract Art Print | Photify',
  'Bold and vibrant abstract art with explosive colors.',
  ARRAY['colorful art', 'bold art', 'statement piece'],
  '["Gallery-wrapped", "Premium cotton canvas", "Eco-friendly inks"]'::jsonb,
  '[{"label": "Style", "value": "Contemporary Abstract"}, {"label": "Color Palette", "value": "Multi-color"}]'::jsonb,
  '[]'::jsonb,
  42,
  'active',
  true
),

-- Product 4: Divine Light
(
  'Divine Light',
  'divine-light',
  'Spiritual artwork depicting divine illumination. A serene piece that brings peace and reflection.',
  'Religion',
  '£88.00',
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'],
  'Framed Print',
  false,
  'Divine Light Religious Art | Photify',
  'Beautiful spiritual art depicting divine light.',
  ARRAY['religious art', 'spiritual decor', 'meditation art'],
  '["Framed option available", "Archival quality", "Acid-free paper"]'::jsonb,
  '[{"label": "Theme", "value": "Spiritual"}, {"label": "Mood", "value": "Peaceful"}]'::jsonb,
  '[]'::jsonb,
  28,
  'active',
  true
),

-- Product 5: Wild Lion
(
  'Wild Lion',
  'wild-lion',
  'Majestic lion portrait capturing raw power and beauty. Stunning wildlife photography.',
  'Animals',
  '£92.00',
  ARRAY['https://images.unsplash.com/photo-1614027164847-1b28cfe1df60', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0'],
  'Canvas',
  false,
  'Wild Lion Portrait | Wildlife Art | Photify',
  'Majestic lion wildlife art printed on premium canvas.',
  ARRAY['lion art', 'wildlife photography', 'animal art'],
  '["Professional photography", "Sharp details", "Large format available"]'::jsonb,
  '[{"label": "Subject", "value": "African Lion"}, {"label": "Print Type", "value": "Canvas"}]'::jsonb,
  '[]'::jsonb,
  31,
  'active',
  true
),

-- Product 6: Himalayan Peaks
(
  'Himalayan Peaks',
  'himalayan-peaks',
  'Stunning mountain landscape from the Himalayas. Breathtaking views of snow-capped peaks.',
  'Nepal',
  '£105.00',
  ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e'],
  'Canvas',
  false,
  'Himalayan Peaks Landscape | Nepal Art | Photify',
  'Breathtaking Himalayan mountain landscape photography.',
  ARRAY['himalayan art', 'mountain landscape', 'nepal art'],
  '["High-resolution print", "Weather-resistant coating", "Panoramic available"]'::jsonb,
  '[{"label": "Location", "value": "Nepal Himalayas"}, {"label": "View", "value": "Panoramic"}]'::jsonb,
  '[]'::jsonb,
  22,
  'active',
  true
),

-- Product 7: Modern Geometry
(
  'Modern Geometry',
  'modern-geometry',
  'Contemporary geometric abstract design. Clean lines and bold shapes create a sophisticated aesthetic.',
  'Abstract',
  '£45.00',
  ARRAY['https://images.unsplash.com/photo-1557672172-298e090bd0f1'],
  'Poster',
  false,
  'Modern Geometry Abstract Poster | Photify',
  'Sleek geometric abstract design for minimalist interiors.',
  ARRAY['geometric art', 'minimalist art', 'modern design'],
  '["Matte finish", "Lightweight", "Easy to frame"]'::jsonb,
  '[{"label": "Style", "value": "Minimalist"}, {"label": "Type", "value": "Poster"}]'::jsonb,
  '[]'::jsonb,
  60,
  'active',
  false
),

-- Product 8: Serene Buddha
(
  'Serene Buddha',
  'serene-buddha',
  'Peaceful Buddha meditation art. Creates a calming atmosphere perfect for yoga studios.',
  'Religion',
  '£75.00',
  ARRAY['https://images.unsplash.com/photo-1545569341-9eb8b30979d9'],
  'Canvas',
  false,
  'Serene Buddha Meditation Art | Photify',
  'Calming Buddha artwork for meditation spaces.',
  ARRAY['buddha art', 'meditation decor', 'zen art'],
  '["Meditation-focused", "Calming tones", "Spiritual energy"]'::jsonb,
  '[{"label": "Theme", "value": "Buddhism"}, {"label": "Mood", "value": "Serene"}]'::jsonb,
  '[]'::jsonb,
  45,
  'active',
  false
);

COMMIT;

-- ============================================
-- Verification Query
-- ============================================
SELECT 
    id,
    name,
    product_type,
    category,
    price,
    status,
    is_bestseller,
    array_length(images, 1) as image_count,
    stock_quantity
FROM art_products
ORDER BY created_at DESC;

-- Show total count
SELECT COUNT(*) as total_products FROM art_products;

