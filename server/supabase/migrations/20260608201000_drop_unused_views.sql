-- Drop unused database views.
--
-- Audit (app/src + server/src only) found these views have no active callers:
--   * v_products_with_min_price   - never referenced
--   * v_settings_by_category      - never referenced
--   * v_sizes_with_ratios         - never referenced (code reads sizes /
--                                   aspect_ratios directly)
--   * v_room_hotspots_with_products - only a hook (useRoomHotspotsWithDetails)
--                                   that is never imported/called
--   * v_product_reviews_with_details - only a hook (useReviewsWithDetails)
--                                   that is never imported/called
--
-- The still-used view v_categories_with_counts is intentionally left in place
-- (consumed by app/src/pages/category/index.tsx and admin-categories-page.tsx).

DROP VIEW IF EXISTS public.v_products_with_min_price;
DROP VIEW IF EXISTS public.v_settings_by_category;
DROP VIEW IF EXISTS public.v_sizes_with_ratios;
DROP VIEW IF EXISTS public.v_room_hotspots_with_products;
DROP VIEW IF EXISTS public.v_product_reviews_with_details;
