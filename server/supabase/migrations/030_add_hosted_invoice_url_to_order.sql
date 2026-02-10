-- Migration: Add hosted invoice URL to orders
-- Version: 030
-- Description: Adds hosted_invoice_url column to orders table
-- Date: 2026-02-08

BEGIN;

ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS hosted_invoice_url TEXT;

COMMENT ON COLUMN orders.hosted_invoice_url IS 'Hosted invoice URL for the order';

COMMIT;
