# Database Migrations

This directory is an **exact mirror of the remote `main` branch migration
history** for the linked Supabase project `mhlmbpnyckrqyznwmbwo` (Photify
Ecommerce). It was re-synced on **2026-06-06** so that `supabase migration list`,
`supabase db push`, and `supabase db reset` all agree with `main`.

## Active migrations (apply in order)

| Version          | File                                                  | Purpose                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001`            | `001_baseline_public.sql`                             | History stub (`-- applied via dump 2026-05-14;`). The real schema is in `20260417153339`.                                                                                                   |
| `002`            | `002_baseline_storage.sql`                            | History stub. Storage objects are owned by Supabase.                                                                                                                                        |
| `20260417153339` | `20260417153339_remote_schema.sql`                    | Full `public` schema dump (tables, views, functions, RLS, grants).                                                                                                                          |
| `20260514202040` | `20260514202040_branch_merge_2026-05-14T20-20-38.sql` | Drops `product_pricings` / `photify_uploads`; adds `ai_tools`, `parcel2go_webhook_events`, order tracking + discount columns, `products.name_embedding` / `search_text`.                    |
| `20260529165614` | `20260529165614_004_affiliates.sql`                   | Affiliate role helpers (`jwt_role`, `is_admin`, `is_affiliate`).                                                                                                                            |
| `20260606162817` | `20260606162817_004_affiliates_restore.sql`           | Full affiliate program (tables, RLS, RPCs, triggers).                                                                                                                                       |
| `20260608170000` | `20260608170000_promo_percentage_auto_apply.sql`      | Percentage-only promotions, `auto_apply` column, simplified `is_promotion_valid`.                                                                                                           |
| `20260608194500` | `20260608194500_drop_unused_products_columns.sql`     | Drops unused `products` columns (`content_sections`, `stock_quantity`, `is_bestseller`, `meta_robots`, `name_embedding`, `search_text`) + dependent indexes and `search_products_semantic`. |

These versions match the remote `schema_migrations` table one-to-one and are
byte-for-byte identical to what is stored on `main` (verified via md5).

## Important

- **Do not renumber or "clean up" these files.** They mirror applied history on
  `main`. Renaming a version will break `supabase db push` / `migration list`.
- To make a new schema change, create a new migration with
  `supabase migration new <name>` (never hand-pick a version/filename).
- `001` / `002` are intentionally tiny stubs — the live schema is reconstructed
  by `20260417153339` + later migrations.

## Archived (not on `main`)

`archive/local-only-pre-main-sync-2026-06-06/` holds migrations that previously
existed locally but were **never recorded in `main`'s history**:

- `003_drop_unused_tables_and_columns.sql`
- `004_affiliates.sql` (clean rewrite; superseded by the two affiliate
  migrations above)
- `005_storage_folders.sql`

They are kept for reference only. If any of those changes are still wanted on
`main`, re-introduce them as **new** forward migrations (`supabase migration
new ...`) rather than restoring these files.

`archive/` (root) also keeps older consolidated category migrations
(`007`–`009`) from before the 2026-05-14 rebaseline.
