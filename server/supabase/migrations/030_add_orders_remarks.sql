-- Migration: Add Remarks Column to Orders
-- Version: 030
-- Description: Adds internal/admin remarks support for orders
-- Date: 2026-02-06
-- Dependencies: 001_initial_schema.sql

BEGIN;

-- ============================================
-- Add Remarks Column
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN public.orders.remarks IS
'Internal remarks or special notes related to the order (admin/system use)';

COMMIT;
