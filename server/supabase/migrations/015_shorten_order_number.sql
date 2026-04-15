-- Shorten order number format from PH-YYYYMMDD-XXXX to PH-XXXXXX
-- Previous: PH-20251028-1234 (16 chars)
-- New:      PH-123456 (9 chars) - 6 digits gives 1M unique combinations per day

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  WHILE attempts < max_attempts LOOP
    -- Generate short format: PH-XXXXXX (e.g., PH-123456)
    new_order_number := 'PH-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if this order number already exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
      RETURN new_order_number;
    END IF;

    attempts := attempts + 1;
  END LOOP;

  -- Fallback: use timestamp if we somehow can't find a unique number
  new_order_number := 'PH-' || TO_CHAR(NOW(), 'YYYYMMDD-HHMMSS');

  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document this change
COMMENT ON FUNCTION generate_order_number() IS 'Generates short order numbers in format PH-XXXXXX (9 characters total). Retries up to 10 times to find a unique number.';
