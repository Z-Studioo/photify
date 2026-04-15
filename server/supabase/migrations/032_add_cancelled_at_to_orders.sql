-- Migration: Add cancelled_at Column to Orders
-- Version: 032
-- Description: Add column to track when orders are cancelled
-- Date: 2025-03-26

BEGIN;

-- Add cancelled_at column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for cancelled_at queries
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON public.orders(cancelled_at DESC);

-- Add comment
COMMENT ON COLUMN public.orders.cancelled_at IS 'Timestamp when order was cancelled';

COMMIT;
