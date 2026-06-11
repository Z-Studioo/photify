-- Migration: Drop unused tables and columns
-- Version: 003
-- Description: Removes tables and columns that have zero references in the
--              app/ and server/src/ codebases. Identified via a full
--              cross-reference audit on 2026-05-14 against baseline 001.
-- Date: 2026-05-14
--
-- Scope (Tier 1 — high-confidence only):
--   Tables dropped:
--     - public.order_items           (orders use orders.items JSON instead)
--     - public.photify_uploads       (no code references)
--     - public.product_pricings      (no code references; pricing flows
--                                     through products + sizes)
--   Views dropped (cascaded or explicit, also unused in app code):
--     - public.v_product_pricings_with_sizes (cascade-drop from product_pricings)
--     - public.v_settings_by_category        (depended on setting_type)
--   Columns dropped:
--     - products.meta_robots
--     - products.content_sections
--     - products.stock_quantity      (only art_products.stock_quantity is used)
--     - art_products.customization_product_id
--     - promotions.excluded_product_ids
--     - site_settings.setting_type
--
-- Not dropped (deferred — needs product-decision):
--   - product_reviews table + 6 unused columns (UI uses mocked reviews;
--     dropping later if reviews stay mocked)
--   - art_products.meta_title / meta_description / trust_badges
--     (exist but never populated; decide UI direction first)
--   - products.meta_title / meta_description references in loader
--     (code-side bug, not a schema problem)

BEGIN;

-- ============================================================================
-- 1. Drop tables
-- ============================================================================
-- Use CASCADE to remove FKs/triggers/policies depending on these tables.

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.photify_uploads CASCADE;
DROP TABLE IF EXISTS public.product_pricings CASCADE;

-- ============================================================================
-- 2. Drop columns on `products`
-- ============================================================================

ALTER TABLE public.products
  DROP COLUMN IF EXISTS meta_robots,
  DROP COLUMN IF EXISTS content_sections,
  DROP COLUMN IF EXISTS stock_quantity;

-- ============================================================================
-- 3. Drop column on `art_products`
-- ============================================================================

ALTER TABLE public.art_products
  DROP COLUMN IF EXISTS customization_product_id;

-- ============================================================================
-- 4. Drop column on `promotions`
-- ============================================================================

ALTER TABLE public.promotions
  DROP COLUMN IF EXISTS excluded_product_ids;

-- ============================================================================
-- 5. Drop column on `site_settings`
-- ============================================================================
-- Drop dependent view first; it's also unused by app/ and server/src/.

DROP VIEW IF EXISTS public.v_settings_by_category;

ALTER TABLE public.site_settings
  DROP COLUMN IF EXISTS setting_type;

COMMIT;
