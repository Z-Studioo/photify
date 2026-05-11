-- Migration: Order status change audit trail
-- Version: 038
-- Description: Every status mutation (admin manual, Stripe webhook, Parcel2Go automation,
--              system cancellation) is recorded here so we can trace who did what and
--              when. Also acts as a guard against duplicate email sends — callers can
--              check the most recent history row for an order before re-firing a
--              notification.
-- Date: 2026-05-11

BEGIN;

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT NOT NULL REFERENCES public.orders(order_number) ON DELETE CASCADE,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  source          TEXT NOT NULL,
  actor           TEXT,
  reason          TEXT,
  email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.order_status_history       IS 'Append-only audit trail of order status transitions';
COMMENT ON COLUMN public.order_status_history.source IS 'admin | stripe | parcel2go-webhook | parcel2go-sync | parcel2go-cron | system';
COMMENT ON COLUMN public.order_status_history.actor  IS 'Admin user id / email when source=admin, otherwise NULL';
COMMENT ON COLUMN public.order_status_history.reason IS 'Free-form reason (e.g. cancellation reason)';
COMMENT ON COLUMN public.order_status_history.metadata IS 'Optional structured payload (tracking stage, parcel2go ids, etc.)';

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_number
  ON public.order_status_history(order_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_history_source
  ON public.order_status_history(source);

-- RLS: lock the table down. The backend reads/writes with the service role
-- key (which bypasses RLS) so the admin UI never touches this table directly.
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

COMMIT;
