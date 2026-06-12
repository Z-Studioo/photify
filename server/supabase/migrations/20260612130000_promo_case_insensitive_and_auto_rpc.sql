-- Promo: case-insensitive validation + canonical auto-apply fetch for FE.

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
  WHERE upper(code) = upper(promotion_code)
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

COMMENT ON FUNCTION public.is_promotion_valid IS
  'Validates a promotion code (case-insensitive) and calculates discount amount';

CREATE OR REPLACE FUNCTION public.get_active_auto_promo()
RETURNS TABLE(
  code character varying,
  value numeric,
  type character varying,
  categories text[],
  excluded_product_ids text[],
  end_date date
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.code,
    p.value,
    p.type,
    p.categories,
    p.excluded_product_ids,
    p.end_date
  FROM public.promotions p
  WHERE p.auto_apply = true
    AND p.is_active = true
    AND p.type = 'percentage'
    AND p.start_date <= CURRENT_DATE
    AND p.end_date >= CURRENT_DATE
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_active_auto_promo IS
  'Returns the single active auto-apply percentage promotion, if any.';

GRANT EXECUTE ON FUNCTION public.get_active_auto_promo() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_auto_promo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_auto_promo() TO service_role;
