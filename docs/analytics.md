# Photify Analytics

Single source of truth for what we track, where, and why.

## Stack

| Layer                              | Tool                                    | Where it's configured                                                               |
| ---------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| Tag library                        | **GA4** via `gtag.js` (Consent Mode v2) | `app/src/root.tsx` — inline snippet, hostname-gated                                 |
| Typed client API                   | `app/src/lib/analytics/index.ts`        | All call sites import `track()` from `@/lib/analytics`                              |
| Product analytics + session replay | **PostHog** (EU region)                 | `app/src/lib/analytics/posthog.ts`, init in `entry.client.tsx`                      |
| Server-side ecommerce              | **GA4 Measurement Protocol**            | `server/src/lib/ga4.ts`, called from `webhookController.ts`                         |
| Consent                            | Banner with full Consent Mode v2 wiring | `app/src/components/shared/cookie-consent.tsx`, state in `lib/analytics/consent.ts` |

## Live-site gating — _why we don't see dev traffic_

Three independent layers, **all must pass** for an event to leave the user's machine:

1. **Hostname check** — `isLiveSite()` returns `true` only for `photify.co` / `www.photify.co`. Localhost, every `*.onrender.com` preview, and any staging URL fail this check.
2. **Consent check** — Google Consent Mode v2 defaults all storage to `denied`; nothing fires until the user clicks Accept in the banner.
3. **Server check** — `server/src/lib/ga4.ts#isLiveDeploy()` parses `PUBLIC_APP_URL` and only sends when the hostname is exactly `photify.co` or `www.photify.co`.

If any layer fails, the call is a silent no-op.

## Event taxonomy

All events go through `track()` in `app/src/lib/analytics/index.ts`, which is a discriminated union — adding a typo is a compile error.

### GA4 standard ecommerce (client)

| Event               | Wired in                                              | Notes                                                                                                                |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `page_view`         | `<PageViewTracker/>` in `root.tsx`                    | Auto-fires on every React Router navigation. `/admin/*` is excluded and additionally tagged `traffic_type=internal`. |
| `view_item_list`    | `components/pages/products/index.tsx`                 | First 20 items per emission (GA4 caps at 25).                                                                        |
| `view_item`         | `components/pages/product/[id]/index.tsx`             | Re-emits when product id changes.                                                                                    |
| `view_cart`         | `components/pages/cart/index.tsx`                     | Re-emits on `cartItems.length` change.                                                                               |
| `add_to_cart`       | `context/CartContext.tsx#addToCart`                   | Single hook covers product pages, customizers, and AI tools.                                                         |
| `remove_from_cart`  | `context/CartContext.tsx#removeFromCart`              |                                                                                                                      |
| `begin_checkout`    | `components/pages/checkout/index.tsx` (mount)         |                                                                                                                      |
| `add_shipping_info` | `components/pages/checkout/index.tsx#handleContinue`  | `shipping_tier` derived from delivery cost (£5 threshold = express).                                                 |
| `add_payment_info`  | `components/pages/checkout/index.tsx` (currentStep=2) |                                                                                                                      |
| `purchase`          | `components/pages/confirmation/index.tsx`             | Deduped per-tab in `sessionStorage`. Deduped against the server event in GA4 by `transaction_id`.                    |

### GA4 standard ecommerce (server-side, Stripe webhook)

`server/src/controllers/webhookController.ts` calls these in addition to the client fires above. Both share the same `transaction_id` (= Stripe `payment_intent.id`) so GA4 dedupes.

| Event      | Webhook handler                                          |
| ---------- | -------------------------------------------------------- |
| `purchase` | `checkout.session.completed`, `payment_intent.succeeded` |
| `refund`   | `charge.refunded` (new)                                  |

### Photify-specific events

| Event                            | Wired in                                                   | Triggers                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `customizer_start`               | `pages/dashboard/index.tsx`                                | Mount of the canvas configurer. **Extend to other `/customize/*` pages with the right `product_type`** — see "What's still TODO" below. |
| `customizer_step`                | _not yet wired_                                            | TODO — fire on step transitions in each customizer panel.                                                                               |
| `image_upload`                   | `pages/upload/index.tsx#processFile`                       | After validation passes, with `mb` / `width` / `height` measured async.                                                                 |
| `image_upload_failed`            | `pages/upload/index.tsx#processFile`                       | `reason`: `invalid_type` / `too_large`.                                                                                                 |
| `crop_completed`                 | _not yet wired_                                            | TODO — fire in `ImageCropper` on done.                                                                                                  |
| `ai_tool_used`                   | `components/ai-tools/ai-background-remover/index.tsx`      | Other AI tools follow the same pattern — copy/paste from the BG remover.                                                                |
| `preset_applied`                 | _not yet wired_                                            | TODO — fire in `PresetContext.applyPreset`.                                                                                             |
| `3d_preview_viewed`              | _not yet wired_                                            | TODO — fire on mount of `product-3d-view`.                                                                                              |
| `promo_applied` / `promo_failed` | `components/pages/cart/index.tsx#handleApplyPromo`         |                                                                                                                                         |
| `address_lookup`                 | `components/pages/checkout/index.tsx#handlePostcodeSearch` | `success` bool.                                                                                                                         |
| `contact_form_submitted`         | `components/pages/contact/index.tsx`                       | Fires after the API call succeeds.                                                                                                      |
| `track_order_view`               | `components/pages/track-order/index.tsx#handleSearch`      |                                                                                                                                         |

## GA4 admin — _one-time setup checklist_

Run through these in `analytics.google.com` for the `Photify > Website` property:

### 1. Mark key events (Admin → Events)

Tick the **"Mark as key event"** toggle for:

- `purchase`
- `begin_checkout`
- `add_to_cart`
- `customizer_start`
- `ai_tool_used`
- `contact_form_submitted`

### 2. Register custom dimensions (Admin → Custom definitions)

These map our event params to dimensions you can slice reports by. Add each as a new **custom dimension**:

| Display name    | Scope | User/Event parameter                                       |
| --------------- | ----- | ---------------------------------------------------------- |
| Product type    | Event | `item_category` _(already standard — no need to register)_ |
| AI tool         | Event | `tool`                                                     |
| Customizer step | Event | `step`                                                     |
| Image source    | Event | `source`                                                   |
| Aspect ratio    | Event | `aspect_ratio`                                             |
| Canvas size     | Event | `canvas_size`                                              |
| Customer type   | User  | `customer_type`                                            |

### 3. Data filter — internal traffic (Admin → Data Filters)

The default "Internal Traffic" filter ships in **Testing** mode. The page view tracker emits `traffic_type=internal` on every `/admin/*` page, so:

1. Open the default filter.
2. Set "Filter operation" to **Exclude**.
3. Set parameter value to **internal**.
4. Flip state to **Active**.

### 4. Data retention (Admin → Data Settings → Data Retention)

Set **Event data retention** to **14 months** (max for free tier).

### 5. Link Google Ads / Search Console _(optional, when ready)_

Admin → Product Links. No code changes needed — just authorize.

## PostHog admin — _one-time setup_

In `eu.posthog.com` for the `Photify` project:

1. **Replay → Settings** — set _Replay sample rate_ to `1.0` for now; tune down once traffic justifies. Confirm masking is on for inputs.
2. **Insights** — build the customizer funnel: `customizer_start → image_upload → add_to_cart → begin_checkout → purchase`.
3. **Cohorts** — create `AI tool users` based on `ai_tool_used` to compare their purchase rate vs. the rest.
4. **Settings → Project** — disable IP capture if GDPR review asks for it (events still work without IP).

## Operating model

- **All call sites use `track()` from `@/lib/analytics`** — never call `gtag` or `posthog.capture` directly.
- **Failure is silent.** Every call site wraps `track()` in `try/catch`. Analytics must never break the app.
- **Adding an event:** add it to the `AnalyticsEvent` discriminated union in `lib/analytics/index.ts` first, then call `track()` from the new site. TypeScript will guide the params.
- **Rotating secrets:** the credentials referenced in `.env.example` should be rotated annually or on staff departure. GA4 measurement IDs are public; the Measurement Protocol API secret is not — keep it in the Render Dashboard, never in the repo.

## What's still TODO

The foundation is in place; these are the mechanical follow-ups when traffic warrants further granularity:

- [ ] Wire `customizer_start` + `customizer_step` into the other `/customize/*` pages (`multi-canvas-wall`, `event-canvas`, `photo-collage-creator`, `single-canvas`).
- [ ] Wire `ai_tool_used` into the remaining tools: `ai-restore`, `ai-collage`, `ai-generate`, `ai-photo-editor`, `ai-print-size`.
- [ ] Wire `preset_applied` in `context/PresetContext.tsx`.
- [ ] Wire `crop_completed` in `components/shared/common/ImageCropper.tsx`.
- [ ] Wire `3d_preview_viewed` in `components/product-configs/shared/product-3d-view.tsx`.

Each is a 5-line drop-in — copy from the wired examples above.
