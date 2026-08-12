-- Seed the `store_status` site setting used by the store open/close feature.
--
--   closed       master switch set from /admin/settings
--   reopen_date  YYYY-MM-DD — the store automatically reopens at the start of
--                this day; shown to customers on the closed screen
--   message      optional custom copy for the closed screen
--
-- Public so the storefront (anon) can read it; writes are covered by the
-- existing "Admins manage settings" policy (authenticated role).

INSERT INTO public.site_settings (setting_key, setting_value, category, description, is_public)
VALUES (
  'store_status',
  '{"closed": false, "reopen_date": null, "message": ""}'::jsonb,
  'general',
  'Store open/closed status. When closed, the storefront shows a closed screen and the API rejects new orders.',
  true
)
ON CONFLICT (setting_key) DO NOTHING;
