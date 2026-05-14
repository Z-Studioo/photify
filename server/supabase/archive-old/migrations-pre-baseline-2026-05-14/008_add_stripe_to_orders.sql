-- Migration: Add Stripe Payment Columns to Orders
-- Version: 008
-- Description: Extends existing orders table with Stripe payment tracking
-- Date: 2025-10-28
-- Dependencies: 001_initial_schema.sql

BEGIN;

-- ============================================
-- Add Stripe Payment Columns
-- ============================================
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS video_permission BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS shipping_postcode VARCHAR(50);

-- ============================================
-- Add Constraints
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_payment_status_check 
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

-- ============================================
-- Create Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at DESC);

-- ============================================
-- Create Functions
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    -- Generate format: PH-YYYYMMDD-XXXX (e.g., PH-20251028-1234)
    new_order_number := 'PH-' || 
                       TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if this order number already exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
      done := true;
    END IF;
  END LOOP;
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
  
  -- Create new policy for service role
  CREATE POLICY "Service role can manage orders"
    ON public.orders FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Add policy for anon users to insert orders (checkout)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anon can insert orders" ON public.orders;
  
  CREATE POLICY "Anon can insert orders"
    ON public.orders FOR INSERT
    TO anon
    WITH CHECK (true);
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN public.orders.items IS 'JSONB array of order items with product details';
COMMENT ON COLUMN public.orders.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, paid, failed, refunded';
COMMENT ON COLUMN public.orders.video_permission IS 'Customer consent for order preparation video';

COMMIT;

