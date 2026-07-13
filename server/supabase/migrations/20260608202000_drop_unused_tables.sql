-- Drop unused database tables and their review-only helper functions.
--
-- Audit (app/src + server/src) found no active table callers:
--   * order_items - order line items are stored in orders.items JSON; code
--                   references "order_items" only as email/template payload keys.
--   * parcel2go_webhook_events - no active implementation writes or reads it.
--   * product_reviews - dormant review feature; hooks/views were removed.
--   * ai_tools - home-page section was disabled and frontend references removed.

-- Review RPCs/trigger helpers would become broken after product_reviews is
-- removed because PL/pgSQL function bodies are not automatically dependency-
-- checked against table names.
DROP FUNCTION IF EXISTS public.get_product_reviews(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_rating_distribution(uuid);

-- Keep this migration robust if it is replayed against an environment where
-- the previous unused-views migration has not been applied yet.
DROP VIEW IF EXISTS public.v_product_reviews_with_details;

DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.parcel2go_webhook_events CASCADE;
DROP TABLE IF EXISTS public.product_reviews CASCADE;
DROP TABLE IF EXISTS public.ai_tools CASCADE;

-- These trigger helpers were attached to product_reviews, so they are dropped
-- after the table removes its dependent triggers.
DROP FUNCTION IF EXISTS public.update_product_rating();
DROP FUNCTION IF EXISTS public.update_product_rating_on_delete();
