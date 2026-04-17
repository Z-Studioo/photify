-- Seed Single Canvas Product with Full SEO and Content Data
-- Run this after migration 006_add_product_seo_content.sql

BEGIN;

-- Insert or update Single Canvas product
INSERT INTO products (
  id,
  name,
  slug,
  description,
  price,
  old_price,
  images,
  is_featured,
  product_type,
  active,
  config_status,
  
  -- SEO Fields
  seo_title,
  seo_description,
  seo_keywords,
  meta_robots,
  canonical_url,
  og_title,
  og_description,
  og_image,
  
  -- Content Fields
  features,
  specifications,
  trust_badges,
  average_rating,
  review_count
) VALUES (
  '00845beb-23c6-4d3b-8f55-a62eb956f182', -- Fixed UUID for single-canvas
  'Single Canvas',
  'single-canvas',
  'Transform your favorite memories into stunning canvas art. Museum-quality canvas material with fade-resistant inks. Free UK delivery. Ready to hang.',
  0.15, -- Per square inch price
  NULL,
  ARRAY[
    'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1758945631260-a0077e8cc873?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1731251447169-1be7bfdc9d0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true, -- is_featured
  'canvas',
  true, -- active
  'draft', -- Will be set to 'active' after configuration
  
  -- SEO Fields (editable from admin)
  'Single Canvas Print - Custom Photo Canvas | Photify',
  'Transform your memories into stunning canvas art. Museum-quality materials, fade-resistant inks, free UK delivery. Customize your canvas print today!',
  ARRAY['canvas prints', 'photo canvas', 'custom canvas', 'canvas wall art', 'personalized canvas', 'photo gifts', 'wall decor', 'canvas printing UK', 'custom photo prints', 'canvas art'],
  'index,follow',
  'https://photify.com/product/single-canvas',
  'Single Canvas Print - Custom Photo Canvas | Photify',
  'Transform your favorite memories into stunning canvas art. Museum-quality materials, free UK delivery.',
  'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?w=1200',
  
  -- Features (editable from admin)
  '[
    {"text": "Museum-quality canvas material"},
    {"text": "Fade-resistant inks for lasting vibrancy"},
    {"text": "Hand-stretched on premium wooden frames"},
    {"text": "Ready to hang with included hardware"},
    {"text": "Protective coating for durability"},
    {"text": "Made to order with your photos"}
  ]'::jsonb,
  
  -- Specifications (editable from admin)
  '[
    {"label": "Material", "value": "100% Cotton Canvas"},
    {"label": "Frame", "value": "Premium Pine Wood"},
    {"label": "Print Quality", "value": "300 DPI"},
    {"label": "Finish Options", "value": "Matte or Glossy"},
    {"label": "Production Time", "value": "3-5 business days"},
    {"label": "Shipping", "value": "Free UK delivery"}
  ]'::jsonb,
  
  -- Trust Badges (editable from admin)
  '[
    {"icon": "Shield", "title": "Quality", "subtitle": "Guaranteed"},
    {"icon": "Truck", "title": "Free", "subtitle": "Shipping"},
    {"icon": "RefreshCw", "title": "30-Day", "subtitle": "Returns"},
    {"icon": "Star", "title": "4.9★", "subtitle": "Rating"}
  ]'::jsonb,
  
  4.9, -- average_rating
  127  -- review_count
)
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  images = EXCLUDED.images,
  is_featured = EXCLUDED.is_featured,
  product_type = EXCLUDED.product_type,
  active = EXCLUDED.active,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_keywords = EXCLUDED.seo_keywords,
  meta_robots = EXCLUDED.meta_robots,
  canonical_url = EXCLUDED.canonical_url,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_image = EXCLUDED.og_image,
  features = EXCLUDED.features,
  specifications = EXCLUDED.specifications,
  trust_badges = EXCLUDED.trust_badges,
  average_rating = EXCLUDED.average_rating,
  review_count = EXCLUDED.review_count;

-- Collage on single canvas: same flow as single-canvas; UUID must match app registry (COLLAGE_ON_SINGLE_CANVAS_PRODUCT.id)
INSERT INTO products (
  id,
  name,
  slug,
  description,
  price,
  old_price,
  images,
  is_featured,
  product_type,
  active,
  config_status,
  seo_title,
  seo_description,
  seo_keywords,
  meta_robots,
  canonical_url,
  og_title,
  og_description,
  og_image,
  features,
  specifications,
  trust_badges,
  average_rating,
  review_count
) VALUES (
  '7f3b2a9c-4d5e-6f70-8a9b-0c1d2e3f4a5b',
  'Collage on Single Canvas',
  'collage-on-single-canvas',
  'Combine multiple photos into one stunning canvas print. Same museum-quality materials and sizing as our single canvas line.',
  0.15,
  NULL,
  ARRAY[
    'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    'https://images.unsplash.com/photo-1677658992335-bfe2677dd45e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
  ],
  true,
  'canvas',
  true,
  'draft',
  'Collage on Single Canvas | Photify',
  'Create a multi-photo collage printed on one premium canvas. Custom sizes and free UK delivery.',
  ARRAY['photo collage', 'canvas collage', 'multi photo canvas', 'custom canvas'],
  'index,follow',
  'https://photify.com/product/collage-on-single-canvas',
  'Collage on Single Canvas | Photify',
  'Multiple photos, one beautiful canvas print.',
  'https://images.unsplash.com/photo-1686644472082-75dd48820a5d?w=1200',
  '[
    {"text": "Multiple photos on one canvas"},
    {"text": "Museum-quality print"},
    {"text": "Free UK delivery"}
  ]'::jsonb,
  '[
    {"label": "Material", "value": "100% Cotton Canvas"},
    {"label": "Shipping", "value": "Free UK delivery"}
  ]'::jsonb,
  '[
    {"icon": "Shield", "title": "Quality", "subtitle": "Guaranteed"},
    {"icon": "Truck", "title": "Free", "subtitle": "Shipping"}
  ]'::jsonb,
  4.8,
  0
)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  images = EXCLUDED.images,
  is_featured = EXCLUDED.is_featured,
  product_type = EXCLUDED.product_type,
  active = EXCLUDED.active,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_keywords = EXCLUDED.seo_keywords,
  meta_robots = EXCLUDED.meta_robots,
  canonical_url = EXCLUDED.canonical_url,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_image = EXCLUDED.og_image,
  features = EXCLUDED.features,
  specifications = EXCLUDED.specifications,
  trust_badges = EXCLUDED.trust_badges,
  average_rating = EXCLUDED.average_rating,
  review_count = EXCLUDED.review_count;

COMMIT;

