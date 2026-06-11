# Module Registry

End-to-end map of business **domains** in Photify, for the agent and for humans.
Used by `scalable-architecture.mdc`. Descriptive of **what exists today**, not a
rewrite plan. Update it whenever a domain/feature is added, renamed, or promoted.

A **domain** spans layers: frontend (`app/src`), backend (`server/src`), and DB
(Supabase). A frontend **module** (`app/src/modules/<area>`) is one slice of a
domain — see `module-architecture.mdc`. Always check a domain across all three
layers before changing it, so the layers stay in sync (one contract, not three).

Legend — **FE/BE status**: `module` (consolidated) · `fragmented` (split across
folders) · `direct` (FE talks to Supabase with no BE route) · `none`.

---

## Domains (end-to-end)

### catalog

- **FE** (fragmented): `pages/products`, `pages/product/[id]`, `pages/category*`, `components/pages/products`, `components/shared/category-nav.tsx`
- **BE** (direct): no route — FE queries Supabase `products`/`categories` directly
- **DB**: `products`, `categories`, `product_categories`, `sizes`, `aspect_ratios`, `art_products`, `tags`
- **SSOT target**: `modules/catalog` (FE) + generated DB types shared FE/BE

### configurator

- **FE** (partial): `components/product-configs/*`, `lib/configures/registry.ts`, `pages/customize/*`, `pages/upload`, `pages/crop`, `context/UploadContext.tsx`
- **BE** (none): client-side; persists into `products.config`
- **DB**: `products.config`, `sizes`, `aspect_ratios`
- **SSOT target**: `modules/configurator` with a **single** registry (merge the two)

### checkout (cart + orders + payments)

- **FE** (fragmented): `context/CartContext.tsx`, `pages/cart`, `pages/checkout`, `pages/confirmation`, `pages/track-order`, `components/pages/checkout`
- **BE** (module-ish): `routes/checkout.ts`, `routes/payment-intent.ts`, `routes/orders.ts`, `routes/address.ts`, `controllers/checkoutController.ts`, `controllers/paymentIntentController.ts`, `controllers/orderStatusController.ts`, `controllers/cancelOrderController.ts`, `lib/stripe.ts`
- **DB**: `orders` (+ tracking/discount columns)
- **SSOT debt**: `CartItem`/checkout body shapes redefined in FE and in both BE controllers → one shared contract

### affiliate

- **FE** (fragmented): `pages/affiliate/*`, `pages/r/[code]`, `components/affiliate/*`, `components/pages/affiliate`, `context/AffiliateContext.tsx`, `lib/affiliate-ref.ts`
- **BE** (module): `routes/affiliates.ts`, `controllers/affiliate/*`, `middleware/affiliateAuth.ts`, `lib/affiliate.ts`
- **DB**: affiliate tables/RLS/RPCs from migration `20260606162817_004_affiliates_restore.sql`
- **SSOT debt**: `AffiliateRecord` + status unions hand-maintained in TS vs the SQL definition

### admin

- **FE** (fragmented): `pages/admin/*`, `components/admin/*`, `context/AdminContext.tsx`
- **BE** (thin): `middleware/adminAuth.ts` only — admin pages mostly query Supabase directly
- **DB**: cross-domain (products, categories, orders, promotions, affiliates, art_products …)
- **SSOT target**: `modules/admin` (FE); route writes through domain APIs/hooks

### ai-tools

- **FE** (fragmented): `pages/ai-*`, `components/ai-tools/*`, `lib/data/aiTools.ts`
- **BE** (none): client-side (TensorFlow/upscaler in-browser)
- **DB**: none
- **SSOT target**: `modules/ai-tools` (FE)

### webhooks

- **FE**: none
- **BE** (module): `routes/webhook.ts`, `controllers/webhookController.ts` (Stripe + parcel events)
- **DB**: `parcel2go_webhook_events`, writes `orders`

### messaging/contact

- **FE** (feature): `pages/contact`
- **BE** (feature): `routes/contact.ts`, `controllers/contactController.ts`, `lib/sendgrid.ts`, `server/email-templates/*`
- **DB**: none

### marketing/legal (FE-only, static)

- `pages/privacy-policy`, `pages/terms-of-use`, `pages/refund-return-policy`, `pages/legal/*`, `pages/home` — stay as simple pages, not a module.

---

## Cross-cutting / shared (domain-free — no business logic here)

| Area                         | Frontend                                         | Backend                             |
| ---------------------------- | ------------------------------------------------ | ----------------------------------- |
| UI primitives                | `components/ui`, `components/shared/common`      | —                                   |
| layout                       | `components/layout`, `layouts/*`                 | —                                   |
| analytics                    | `lib/analytics/*` (GA + TikTok)                  | `lib/ga4.ts`                        |
| platform clients             | `lib/supabase/*`                                 | `lib/supabase.ts`, `lib/stripe.ts`  |
| SEO / pricing                | `lib/seo.ts`, `lib/canvas-size-price.ts`         | —                                   |
| shared types (intended SSOT) | `lib/data/types.ts` (drifts from DB — reconcile) | `src/types/index.ts` (generic only) |

---

## Database (single source of truth)

- **Canonical schema** = the active Supabase migrations in
  `server/supabase/migrations/README.md`. These are the only truth.
- **Not authoritative** (reference only): `server/supabase/setup/*`, `archive*/`,
  `MIGRATION_GUIDE.md`, `MISSING_TABLES_IMPLEMENTATION.md`.
- **Gap**: no generated TS `Database` type yet, so DB row shapes are hand-redefined
  in `app/src/lib/data/types.ts` and server controllers. Generating one would link
  all three layers of every domain to a single contract.

---

## Known SSOT debts (ask before expanding any of these)

1. Core types (`Product`, `Category`, `Order`, `CartItem`) redefined in many FE/BE files.
2. FE components call `supabase.from(...)` directly instead of via a domain API/hook.
3. Two configurator registries: `components/product-configs/index.ts` and `lib/configures/registry.ts`.
4. Duplicate Supabase server clients: `lib/supabase/server.ts` and `lib/supabase.server.ts`.
5. No generated Supabase types shared by `app/` and `server/`.
6. Domain contracts (e.g. affiliate status, checkout `CartItem`) defined per layer rather than once.
