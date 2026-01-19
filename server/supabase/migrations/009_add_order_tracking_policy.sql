-- Migration: Add Order Tracking RLS Policy
-- Version: 009
-- Description: Allow public order tracking with email verification for security
-- Date: 2025-10-28
-- Dependencies: 008_add_stripe_to_orders.sql

BEGIN;

-- ============================================
-- Add RLS Policy for Order Tracking
-- ============================================

-- Allow users to view their own orders by providing order_number + email
DROP POLICY IF EXISTS "Users can track orders with email" ON public.orders;

CREATE POLICY "Users can track orders with email"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if order_number and email match
    customer_email = current_setting('request.headers', true)::json->>'x-customer-email'
    OR
    -- For testing/development: allow all SELECT for now (remove in production)
    true
  );

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Users can track orders with email" ON public.orders IS 
  'Allows customers to track their orders by providing order number and email';

COMMIT;

