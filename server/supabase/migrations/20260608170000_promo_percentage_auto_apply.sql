-- Promotions: percentage-only discounts + optional auto-apply on landing.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS auto_apply boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.promotions.auto_apply IS
  'When true, this promotion is auto-applied to all visitors on landing (only one may be active).';

-- Enforce a single auto-apply promo at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_single_auto_apply
  ON public.promotions (auto_apply)
  WHERE auto_apply = true;

-- Remove legacy non-percentage promos before constraining type.
DELETE FROM public.promotions
WHERE type IS DISTINCT FROM 'percentage';

UPDATE public.promotions
SET type = 'percentage'
WHERE type IS NULL OR type = '';

ALTER TABLE public.promotions
  DROP CONSTRAINT IF EXISTS promotions_type_check;

ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_type_check
  CHECK (type = 'percentage');

COMMENT ON COLUMN public.promotions.type IS 'Discount type: percentage only';

CREATE OR REPLACE FUNCTION public.is_promotion_valid(
  promotion_code character varying,
  order_total numeric,
  order_categories text[] DEFAULT ARRAY['all'::text]
)
RETURNS TABLE(valid boolean, discount_amount numeric, error_message text)
LANGUAGE plpgsql
AS $$
DECLARE
  promo RECORD;
  calculated_discount DECIMAL(10, 2);
BEGIN
  SELECT * INTO promo
  FROM promotions
  WHERE code = promotion_code
    AND is_active = true
    AND type = 'percentage'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Invalid or expired promotion code';
    RETURN;
  END IF;

  IF promo.max_uses IS NOT NULL AND promo.used_count >= promo.max_uses THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10, 2), 'Promotion code has reached maximum uses';
    RETURN;
  END IF;

  IF order_total < promo.min_order THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10, 2),
      'Order total must be at least £' || promo.min_order::TEXT;
    RETURN;
  END IF;

  calculated_discount := (order_total * promo.value / 100);

  RETURN QUERY SELECT true, calculated_discount, ''::TEXT;
END;
$$;
