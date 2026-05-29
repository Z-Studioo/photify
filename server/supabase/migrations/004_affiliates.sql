-- Migration: Affiliate program
-- Version: 004
-- Description: Adds the affiliate program (signup -> admin approval -> referral
--              link -> auto-applied promo -> commission ledger -> manual payouts).
--              Introduces a real role model via auth.users.user_metadata.role
--              ∈ {admin, affiliate}. Stricter RLS replaces the previous
--              "any authenticated user" policy where appropriate.
-- Date: 2026-05-29

BEGIN;

-- ============================================================================
-- 0. Helper functions for role-based RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."jwt_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(
    NULLIF(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), ''),
    NULLIF(((current_setting('request.jwt.claims', true))::json -> 'app_metadata' ->> 'role'), '')
  );
$$;

ALTER FUNCTION "public"."jwt_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ SELECT public.jwt_role() = 'admin'; $$;

ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_affiliate"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ SELECT public.jwt_role() = 'affiliate'; $$;

ALTER FUNCTION "public"."is_affiliate"() OWNER TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."jwt_role"() TO "anon", "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon", "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."is_affiliate"() TO "anon", "authenticated", "service_role";

-- ============================================================================
-- 1. system_jobs (debounce for admin-triggered cron-like tasks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."system_jobs" (
    "job_name"       text PRIMARY KEY,
    "last_run_at"    timestamptz,
    "last_status"    text,
    "last_message"   text,
    "updated_at"     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."system_jobs" OWNER TO "postgres";
ALTER TABLE "public"."system_jobs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage system_jobs" ON "public"."system_jobs"
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON "public"."system_jobs" TO "authenticated";
GRANT ALL ON "public"."system_jobs" TO "service_role";

-- ============================================================================
-- 2. affiliates
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."affiliates" (
    "id"                     uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    "user_id"                uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "name"                   varchar(255) NOT NULL,
    "email"                  varchar(255) NOT NULL UNIQUE,
    "phone"                  varchar(50),
    "website"                text,
    "social_handle"          text,
    "audience_description"   text,
    "code"                   varchar(50) UNIQUE,
    "promotion_id"           uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
    "commission_rate"        numeric(5,4) NOT NULL DEFAULT 0.10,
    "customer_discount_pct"  numeric(5,4) NOT NULL DEFAULT 0.05,
    "holding_days"           integer NOT NULL DEFAULT 14,
    "payout_min"             numeric(10,2) NOT NULL DEFAULT 50,
    "payout_method"          text,
    "payout_details"         jsonb DEFAULT '{}'::jsonb,
    "status"                 text NOT NULL DEFAULT 'pending',
    "rejection_reason"       text,
    "admin_notes"            text,
    "applied_at"             timestamptz NOT NULL DEFAULT now(),
    "approved_at"            timestamptz,
    "rejected_at"            timestamptz,
    "disabled_at"            timestamptz,
    "created_at"             timestamptz NOT NULL DEFAULT now(),
    "updated_at"             timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "affiliates_status_check"
      CHECK (status IN ('pending','approved','rejected','disabled')),
    CONSTRAINT "affiliates_commission_rate_check"
      CHECK (commission_rate >= 0 AND commission_rate <= 1),
    CONSTRAINT "affiliates_customer_discount_check"
      CHECK (customer_discount_pct >= 0 AND customer_discount_pct <= 1),
    CONSTRAINT "affiliates_holding_days_check"
      CHECK (holding_days >= 0)
);

ALTER TABLE "public"."affiliates" OWNER TO "postgres";

COMMENT ON TABLE  "public"."affiliates" IS 'Affiliate program participants. user_id is null until the magic-link invite is accepted.';
COMMENT ON COLUMN "public"."affiliates"."code" IS 'Unique referral slug used in /r/:code URLs and as the linked promotion code.';
COMMENT ON COLUMN "public"."affiliates"."commission_rate" IS 'Fractional commission (0.10 = 10%). Per-affiliate override.';
COMMENT ON COLUMN "public"."affiliates"."customer_discount_pct" IS 'Fractional discount auto-applied to customers via the linked promotions row (0.05 = 5%).';
COMMENT ON COLUMN "public"."affiliates"."holding_days" IS 'Days after order delivery before commission flips from pending to approved.';
COMMENT ON COLUMN "public"."affiliates"."payout_min" IS 'Minimum approved balance (£) required before a payout can be issued.';

CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_user_id_unique"
  ON "public"."affiliates"("user_id") WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS "affiliates_status_idx"
  ON "public"."affiliates"("status");
CREATE INDEX IF NOT EXISTS "affiliates_code_idx"
  ON "public"."affiliates"("code") WHERE code IS NOT NULL;

ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;

-- Public can INSERT applications (anon signup form)
CREATE POLICY "Public can apply" ON "public"."affiliates"
  FOR INSERT WITH CHECK (status = 'pending');

-- Affiliate reads/updates only their own row
CREATE POLICY "Affiliate read own" ON "public"."affiliates"
  FOR SELECT USING (public.is_affiliate() AND user_id = auth.uid());
CREATE POLICY "Affiliate update own" ON "public"."affiliates"
  FOR UPDATE USING (public.is_affiliate() AND user_id = auth.uid())
            WITH CHECK (public.is_affiliate() AND user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admins manage affiliates" ON "public"."affiliates"
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON "public"."affiliates" TO "authenticated";
GRANT INSERT ON "public"."affiliates" TO "anon";
GRANT ALL ON "public"."affiliates" TO "service_role";

-- ============================================================================
-- 3. affiliate_payouts
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."affiliate_payouts" (
    "id"               uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    "affiliate_id"     uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    "amount"           numeric(10,2) NOT NULL,
    "method"           text,
    "reference"        text,
    "note"             text,
    "paid_at"          timestamptz NOT NULL DEFAULT now(),
    "created_by"       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at"       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "affiliate_payouts_amount_check" CHECK (amount >= 0)
);

ALTER TABLE "public"."affiliate_payouts" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "affiliate_payouts_affiliate_idx"
  ON "public"."affiliate_payouts"("affiliate_id", "paid_at" DESC);

ALTER TABLE "public"."affiliate_payouts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate read own payouts" ON "public"."affiliate_payouts"
  FOR SELECT USING (
    public.is_affiliate()
    AND affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage payouts" ON "public"."affiliate_payouts"
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT ON "public"."affiliate_payouts" TO "authenticated";
GRANT ALL ON "public"."affiliate_payouts" TO "service_role";

-- ============================================================================
-- 4. affiliate_commissions (ledger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."affiliate_commissions" (
    "id"               uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    "affiliate_id"     uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    "order_id"         uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    "commission_base"  numeric(10,2) NOT NULL,
    "commission_amount" numeric(10,2) NOT NULL,
    "rate"             numeric(5,4) NOT NULL,
    "status"           text NOT NULL DEFAULT 'pending',
    "available_at"     timestamptz,
    "approved_at"      timestamptz,
    "reversed_at"      timestamptz,
    "payout_id"        uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
    "paid_at"          timestamptz,
    "created_at"       timestamptz NOT NULL DEFAULT now(),
    "updated_at"       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "affiliate_commissions_status_check"
      CHECK (status IN ('pending','approved','reversed','paid')),
    CONSTRAINT "affiliate_commissions_base_check" CHECK (commission_base >= 0),
    CONSTRAINT "affiliate_commissions_amount_check" CHECK (commission_amount >= 0)
);

ALTER TABLE "public"."affiliate_commissions" OWNER TO "postgres";

COMMENT ON COLUMN "public"."affiliate_commissions"."commission_base"
  IS 'Order subtotal minus discount (delivery excluded). Source of truth for rate * base = amount.';
COMMENT ON COLUMN "public"."affiliate_commissions"."available_at"
  IS 'When (delivered_at + holding_days) elapses, batch job flips status pending -> approved.';

CREATE INDEX IF NOT EXISTS "affiliate_commissions_approval_idx"
  ON "public"."affiliate_commissions"("status", "available_at");
CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliate_idx"
  ON "public"."affiliate_commissions"("affiliate_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "affiliate_commissions_payout_idx"
  ON "public"."affiliate_commissions"("payout_id") WHERE payout_id IS NOT NULL;

ALTER TABLE "public"."affiliate_commissions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate read own commissions" ON "public"."affiliate_commissions"
  FOR SELECT USING (
    public.is_affiliate()
    AND affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage commissions" ON "public"."affiliate_commissions"
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON "public"."affiliate_commissions" TO "authenticated";
GRANT ALL ON "public"."affiliate_commissions" TO "service_role";

-- ============================================================================
-- 5. affiliate_referrals_daily (lightweight click aggregate)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."affiliate_referrals_daily" (
    "affiliate_id" uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    "day"          date NOT NULL,
    "click_count"  integer NOT NULL DEFAULT 0,
    "updated_at"   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("affiliate_id", "day"),
    CONSTRAINT "affiliate_referrals_daily_click_check" CHECK (click_count >= 0)
);

ALTER TABLE "public"."affiliate_referrals_daily" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "affiliate_referrals_daily_day_idx"
  ON "public"."affiliate_referrals_daily"("day" DESC);

ALTER TABLE "public"."affiliate_referrals_daily" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate read own clicks" ON "public"."affiliate_referrals_daily"
  FOR SELECT USING (
    public.is_affiliate()
    AND affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage clicks" ON "public"."affiliate_referrals_daily"
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON "public"."affiliate_referrals_daily" TO "authenticated";
GRANT ALL ON "public"."affiliate_referrals_daily" TO "service_role";

-- ============================================================================
-- 6. orders: attribution columns
-- ============================================================================

ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "affiliate_id"   uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "affiliate_code" varchar(50);

COMMENT ON COLUMN "public"."orders"."affiliate_id"
  IS 'FK to affiliates row. Set at checkout if customer arrived via /r/:code within attribution window.';
COMMENT ON COLUMN "public"."orders"."affiliate_code"
  IS 'Snapshot of the affiliate code at order time (preserves attribution even if affiliate is renamed/disabled).';

CREATE INDEX IF NOT EXISTS "orders_affiliate_idx"
  ON "public"."orders"("affiliate_id", "created_at" DESC)
  WHERE affiliate_id IS NOT NULL;

-- ============================================================================
-- 7. updated_at triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS "trg_affiliates_updated" ON "public"."affiliates";
CREATE TRIGGER "trg_affiliates_updated"
  BEFORE UPDATE ON "public"."affiliates"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS "trg_affiliate_commissions_updated" ON "public"."affiliate_commissions";
CREATE TRIGGER "trg_affiliate_commissions_updated"
  BEFORE UPDATE ON "public"."affiliate_commissions"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS "trg_affiliate_referrals_daily_updated" ON "public"."affiliate_referrals_daily";
CREATE TRIGGER "trg_affiliate_referrals_daily_updated"
  BEFORE UPDATE ON "public"."affiliate_referrals_daily"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================================
-- 8. RPC: get_affiliate_stats(affiliate_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."get_affiliate_stats"("p_affiliate_id" uuid)
RETURNS TABLE (
  clicks_30d           integer,
  clicks_total         integer,
  orders_count         integer,
  orders_count_30d     integer,
  revenue_total        numeric,
  revenue_30d          numeric,
  pending_amount       numeric,
  approved_amount      numeric,
  paid_amount          numeric,
  reversed_amount      numeric,
  payable_amount       numeric
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH clicks AS (
    SELECT
      COALESCE(SUM(click_count) FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days'), 0)::integer AS clicks_30d,
      COALESCE(SUM(click_count), 0)::integer AS clicks_total
    FROM public.affiliate_referrals_daily
    WHERE affiliate_id = p_affiliate_id
  ),
  orders_agg AS (
    SELECT
      COUNT(*)::integer AS orders_count,
      COUNT(*) FILTER (WHERE o.created_at >= now() - INTERVAL '30 days')::integer AS orders_count_30d,
      COALESCE(SUM(o.total), 0)::numeric AS revenue_total,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= now() - INTERVAL '30 days'), 0)::numeric AS revenue_30d
    FROM public.orders o
    WHERE o.affiliate_id = p_affiliate_id AND o.payment_status = 'paid'
  ),
  commissions_agg AS (
    SELECT
      COALESCE(SUM(commission_amount) FILTER (WHERE status = 'pending'), 0)::numeric  AS pending_amount,
      COALESCE(SUM(commission_amount) FILTER (WHERE status = 'approved'), 0)::numeric AS approved_amount,
      COALESCE(SUM(commission_amount) FILTER (WHERE status = 'paid'), 0)::numeric     AS paid_amount,
      COALESCE(SUM(commission_amount) FILTER (WHERE status = 'reversed'), 0)::numeric AS reversed_amount
    FROM public.affiliate_commissions
    WHERE affiliate_id = p_affiliate_id
  )
  SELECT
    clicks.clicks_30d,
    clicks.clicks_total,
    orders_agg.orders_count,
    orders_agg.orders_count_30d,
    orders_agg.revenue_total,
    orders_agg.revenue_30d,
    commissions_agg.pending_amount,
    commissions_agg.approved_amount,
    commissions_agg.paid_amount,
    commissions_agg.reversed_amount,
    commissions_agg.approved_amount AS payable_amount
  FROM clicks, orders_agg, commissions_agg;
END;
$$;

ALTER FUNCTION "public"."get_affiliate_stats"(uuid) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_affiliate_stats"(uuid) TO "authenticated", "service_role";

-- ============================================================================
-- 9. RPC: approve_due_commissions(batch_limit)
--     Set-based, idempotent. Returns the rows that were approved.
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."approve_due_commissions"("p_batch_limit" integer DEFAULT 200)
RETURNS TABLE (
  commission_id      uuid,
  affiliate_id       uuid,
  order_id           uuid,
  commission_amount  numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT c.id
    FROM public.affiliate_commissions c
    WHERE c.status = 'pending'
      AND c.available_at IS NOT NULL
      AND c.available_at <= now()
    ORDER BY c.available_at ASC
    LIMIT p_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.affiliate_commissions c
     SET status      = 'approved',
         approved_at = now()
   WHERE c.id IN (SELECT id FROM due)
  RETURNING c.id, c.affiliate_id, c.order_id, c.commission_amount;
END;
$$;

ALTER FUNCTION "public"."approve_due_commissions"(integer) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."approve_due_commissions"(integer) TO "service_role";

-- ============================================================================
-- 10. RPC: increment_affiliate_click(code) — fire-and-forget for /r/:code
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."increment_affiliate_click"("p_code" varchar)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  SELECT id INTO v_affiliate_id
    FROM public.affiliates
   WHERE code = p_code AND status = 'approved';

  IF v_affiliate_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.affiliate_referrals_daily (affiliate_id, day, click_count)
  VALUES (v_affiliate_id, CURRENT_DATE, 1)
  ON CONFLICT (affiliate_id, day)
  DO UPDATE SET click_count = public.affiliate_referrals_daily.click_count + 1,
                updated_at = now();
END;
$$;

ALTER FUNCTION "public"."increment_affiliate_click"(varchar) OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."increment_affiliate_click"(varchar) TO "anon", "authenticated", "service_role";

-- ============================================================================
-- 11. Trigger: set commission available_at on order delivery
--
-- Admin marks orders as `delivered` directly via the Supabase client (no
-- server-side endpoint), so we attach the lifecycle hook to the table itself.
-- When `status` flips to 'delivered' for an order that has an affiliate
-- commission, we schedule the commission to become approvable after the
-- affiliate's holding period.
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."set_commission_available_at"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_holding_days integer;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NEW.affiliate_id IS NOT NULL THEN
    SELECT holding_days INTO v_holding_days
      FROM public.affiliates
     WHERE id = NEW.affiliate_id;

    UPDATE public.affiliate_commissions
       SET available_at = now() + (COALESCE(v_holding_days, 14) || ' days')::interval
     WHERE order_id = NEW.id
       AND status = 'pending'
       AND available_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_commission_available_at"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS "trg_set_commission_available_at" ON "public"."orders";
CREATE TRIGGER "trg_set_commission_available_at"
  AFTER UPDATE OF status ON "public"."orders"
  FOR EACH ROW EXECUTE FUNCTION public.set_commission_available_at();

-- ============================================================================
-- 12. Seed system_jobs row for the commission approval batch
-- ============================================================================

INSERT INTO public.system_jobs (job_name, last_run_at, last_status)
VALUES ('affiliate_commission_approval', NULL, 'never_run')
ON CONFLICT (job_name) DO NOTHING;

COMMIT;
