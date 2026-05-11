-- Migration: Add discount and promo_code columns to orders
-- Version: 035
-- Description: Persist promo code and discount amount on each order so admin/customer views can show the breakdown
-- Date: 2026-05-11

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

COMMENT ON COLUMN public.orders.discount IS 'Total discount amount (in GBP) applied to the order from a promo code';
COMMENT ON COLUMN public.orders.promo_code IS 'Promo code applied to the order, if any (e.g. SAVE20)';

CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON public.orders(promo_code) WHERE promo_code IS NOT NULL;

COMMIT;
