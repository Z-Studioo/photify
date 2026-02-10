-- Migration: Add remarks to orders
-- Version: 031
-- Description: Adds remarks column to orders table
-- Date: 2026-02-08

BEGIN;

ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS remarks TEXT;

COMMENT ON COLUMN orders.remarks IS 'Optional remarks for the order';

COMMIT;
