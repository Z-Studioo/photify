-- Migration: Add Parcel2Go shipment columns to orders
-- Version: 036
-- Description: Persist Parcel2Go shipment booking, tracking, carrier, label and parcel snapshot per order
-- Date: 2026-05-11

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parcel2go_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS parcel2go_hash       TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number      TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url         TEXT,
  ADD COLUMN IF NOT EXISTS carrier_name         TEXT,
  ADD COLUMN IF NOT EXISTS service_name         TEXT,
  ADD COLUMN IF NOT EXISTS service_id           TEXT,
  ADD COLUMN IF NOT EXISTS label_url            TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parcel_dimensions    JSONB,
  ADD COLUMN IF NOT EXISTS shipment_cost        DECIMAL(10, 2);

COMMENT ON COLUMN public.orders.parcel2go_order_id IS 'Parcel2Go order/booking identifier returned after booking a shipment';
COMMENT ON COLUMN public.orders.parcel2go_hash    IS 'Parcel2Go quote hash used to book the chosen service';
COMMENT ON COLUMN public.orders.tracking_number   IS 'Carrier tracking number for the shipment';
COMMENT ON COLUMN public.orders.tracking_url      IS 'Public carrier tracking URL';
COMMENT ON COLUMN public.orders.carrier_name      IS 'Courier handling the shipment (e.g. Evri, DPD, Royal Mail)';
COMMENT ON COLUMN public.orders.service_name      IS 'Chosen service name (e.g. Next Day, 48h)';
COMMENT ON COLUMN public.orders.service_id        IS 'Parcel2Go service id chosen at booking time';
COMMENT ON COLUMN public.orders.label_url         IS 'URL to the downloadable shipping label PDF';
COMMENT ON COLUMN public.orders.shipped_at        IS 'Timestamp when the order was marked as shipped/dispatched';
COMMENT ON COLUMN public.orders.parcel_dimensions IS 'Snapshot of parcels used when booking (weight, length, width, height, value)';
COMMENT ON COLUMN public.orders.shipment_cost     IS 'Cost charged by Parcel2Go for this shipment (GBP)';

CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_parcel2go_order_id ON public.orders(parcel2go_order_id) WHERE parcel2go_order_id IS NOT NULL;

COMMIT;
