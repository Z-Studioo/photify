-- Check product config structure
-- Run this in Supabase SQL Editor to see current config data

-- 1. Check all products and their config structure
SELECT 
  id,
  name,
  slug,
  config,
  jsonb_pretty(config) as config_pretty,
  config -> 'configurerType' as configurer_type_value,
  jsonb_typeof(config) as config_type
FROM products
LIMIT 5;

-- 2. Check if config column allows updates
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'config';

-- 3. Try a test update (replace 'your-product-id' with actual ID)
-- UPDATE products 
-- SET config = jsonb_set(
--   COALESCE(config, '{}'::jsonb),
--   '{configurerType}',
--   '"photo-collage-creator"'::jsonb
-- )
-- WHERE id = 'your-product-id';

-- 4. Verify the update
-- SELECT id, name, config -> 'configurerType' as configurer_type
-- FROM products 
-- WHERE id = 'your-product-id';

