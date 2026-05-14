# Pre-Baseline Migrations Archive (2026-05-14)

These 32 migration files were the project's migration history up to and including
`035_create_photify_storage_bucket.sql`. They were archived on 2026-05-14 when the
team decided to consolidate to a single baseline migration generated from the
live Supabase project (`mhlmbpnyckrqyznwmbwo` — Photify Ecommerce).

## Why archived?

The remote database had been modified manually through the Supabase dashboard,
and the team chose to rebaseline rather than reverse-engineer the manual changes
into a new incremental migration. The current state of the remote database is
captured in `server/supabase/migrations/001_baseline_schema.sql`.

## Important

- **Do NOT re-run these.** They reflect a historical schema that has since drifted.
- **Data seeding / backfills in these files are NOT in the new baseline.** The
  baseline only captures the resulting schema, not the steps to populate data.
  If you need to recreate data (e.g. categories, aspect ratios, sizes seed data),
  refer to `server/supabase/seeds/` or pull from the live DB.
- Keep these for reference / historical context only.
