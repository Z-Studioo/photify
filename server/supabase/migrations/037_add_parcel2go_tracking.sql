-- Migration: Parcel2Go webhook + tracking automation
-- Version: 037
-- Description:
--   1. Capture the Parcel2Go OrderLineId (P2G number) for each booked shipment
--      so we can match it against incoming tracking webhooks.
--   2. Track the latest known shipment stage + when we last synced it.
--   3. Persist a delivered timestamp for downstream emails / reporting.
--   4. Create an idempotency log for Parcel2Go webhook deliveries so retries
--      don't double-fire emails or status transitions.
-- Date: 2026-05-11

BEGIN;

-- --- orders ------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parcel2go_orderline_id   TEXT,
  ADD COLUMN IF NOT EXISTS tracking_stage           TEXT,
  ADD COLUMN IF NOT EXISTS tracking_last_synced_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at             TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.parcel2go_orderline_id  IS 'Parcel2Go OrderLine identifier (P2G number) — primary match key for tracking webhooks';
COMMENT ON COLUMN public.orders.tracking_stage          IS 'Last known Parcel2Go tracking stage (Booked, Collected, DroppedOff, InTransit, Delivered, ...)';
COMMENT ON COLUMN public.orders.tracking_last_synced_at IS 'Last time we successfully refreshed tracking from Parcel2Go (poll or webhook)';
COMMENT ON COLUMN public.orders.delivered_at            IS 'Timestamp when the order was confirmed delivered (from Parcel2Go tracking)';

CREATE INDEX IF NOT EXISTS idx_orders_parcel2go_orderline_id
  ON public.orders(parcel2go_orderline_id)
  WHERE parcel2go_orderline_id IS NOT NULL;

-- --- parcel2go_webhook_events -----------------------------------------
-- Idempotency + audit log for Parcel2Go webhook deliveries. Their delivery
-- Id (a GUID) is unique per delivery attempt, so using it as the PK gives us
-- free replay protection.
CREATE TABLE IF NOT EXISTS public.parcel2go_webhook_events (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_timestamp TIMESTAMPTZ,
  signature       TEXT,
  payload         JSONB,
  order_number    TEXT,
  orderline_id    TEXT,
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  error           TEXT
);

COMMENT ON TABLE public.parcel2go_webhook_events IS 'Audit + idempotency log for Parcel2Go webhook deliveries';

CREATE INDEX IF NOT EXISTS idx_parcel2go_webhook_events_type
  ON public.parcel2go_webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_parcel2go_webhook_events_orderline
  ON public.parcel2go_webhook_events(orderline_id)
  WHERE orderline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parcel2go_webhook_events_received_at
  ON public.parcel2go_webhook_events(received_at DESC);

COMMIT;
