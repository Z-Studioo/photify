/**
 * Photify analytics — single entry point for all client-side tracking.
 *
 * Design goals:
 *  - Typed events so call sites can't typo (`add_to_card` -> compile error).
 *  - Fan out to GA4 (gtag) and PostHog from one call, with each vendor
 *    gated independently on (a) live hostname and (b) user consent.
 *  - Fail closed: any error in tracking is swallowed — analytics must
 *    never break the app.
 *  - SSR-safe: every function no-ops when `window` is undefined.
 *
 * See `docs/analytics.md` for the event taxonomy and which custom
 * dimensions need to be registered in GA4.
 */

import { isLiveSite } from './env';
import { getConsent } from './consent';
import {
  capturePostHogEvent,
  identifyPostHog,
  resetPostHog,
} from './posthog';

// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

/** A single line item in an ecommerce event. Mirrors GA4 Item schema. */
export interface AnalyticsItem {
  /** Stable SKU or product ID. Required by GA4. */
  item_id: string;
  /** Display name (without trailing size/ratio segments). */
  item_name: string;
  /** Top-level category, e.g. `Canvas` / `Framed Print`. */
  item_category?: string;
  /** Variant string, e.g. `12" x 12"`. */
  item_variant?: string;
  /** Price per unit in GBP. */
  price?: number;
  quantity?: number;
  /** Photify-specific: which configurator produced this item. */
  product_type?: ProductType;
  aspect_ratio?: string;
  canvas_size?: string;
}

export type ProductType =
  | 'single_canvas'
  | 'multi_canvas_wall'
  | 'event_canvas'
  | 'photo_collage'
  | 'stock_print'
  | 'other';

export type AiTool =
  | 'background_remover'
  | 'restore'
  | 'upscale'
  | 'generate'
  | 'collage'
  | 'print_size'
  | 'photo_editor';

export type CustomizerStep =
  | 'start'
  | 'upload'
  | 'crop'
  | 'size'
  | 'frame'
  | 'preview'
  | 'review';

/**
 * Discriminated union of every event Photify ever fires. New events go
 * here first — the rest of the codebase passes through `track()` which
 * accepts only this type.
 */
export type AnalyticsEvent =
  // ---- GA4 standard ecommerce ----
  | {
      name: 'view_item_list';
      params: { item_list_id?: string; item_list_name: string; items: AnalyticsItem[] };
    }
  | {
      name: 'select_item';
      params: { item_list_id?: string; item_list_name?: string; items: AnalyticsItem[] };
    }
  | {
      name: 'view_item';
      params: { currency: 'GBP'; value: number; items: AnalyticsItem[] };
    }
  | {
      name: 'add_to_cart';
      params: { currency: 'GBP'; value: number; items: AnalyticsItem[] };
    }
  | {
      name: 'remove_from_cart';
      params: { currency: 'GBP'; value: number; items: AnalyticsItem[] };
    }
  | {
      name: 'view_cart';
      params: { currency: 'GBP'; value: number; items: AnalyticsItem[] };
    }
  | {
      name: 'begin_checkout';
      params: {
        currency: 'GBP';
        value: number;
        items: AnalyticsItem[];
        coupon?: string;
      };
    }
  | {
      name: 'add_shipping_info';
      params: {
        currency: 'GBP';
        value: number;
        items: AnalyticsItem[];
        shipping_tier?: 'standard' | 'express';
        coupon?: string;
      };
    }
  | {
      name: 'add_payment_info';
      params: {
        currency: 'GBP';
        value: number;
        items: AnalyticsItem[];
        payment_type?: string;
        coupon?: string;
      };
    }
  | {
      name: 'purchase';
      params: {
        transaction_id: string;
        currency: 'GBP';
        value: number;
        tax?: number;
        shipping?: number;
        coupon?: string;
        items: AnalyticsItem[];
      };
    }
  // ---- Photify custom ----
  | { name: 'customizer_start'; params: { product_type: ProductType } }
  | {
      name: 'customizer_step';
      params: { product_type: ProductType; step: CustomizerStep };
    }
  | {
      name: 'image_upload';
      params: {
        source: 'device' | 'stock' | 'ai_generate';
        mb?: number;
        width?: number;
        height?: number;
      };
    }
  | { name: 'image_upload_failed'; params: { reason: string } }
  | { name: 'crop_completed'; params: { aspect_ratio?: string } }
  | {
      name: 'ai_tool_used';
      params: {
        tool: AiTool;
        duration_ms?: number;
        success: boolean;
        error_reason?: string;
      };
    }
  | { name: 'preset_applied'; params: { preset_name: string } }
  | { name: '3d_preview_viewed'; params: { product_type: ProductType } }
  | {
      name: 'promo_applied';
      params: { code: string; discount_value: number };
    }
  | { name: 'promo_failed'; params: { code: string; reason: string } }
  | { name: 'address_lookup'; params: { success: boolean } }
  | { name: 'contact_form_submitted'; params: Record<string, never> }
  | { name: 'track_order_view'; params: { has_order: boolean } }
  // ---- Page views (auto-fired by <PageViewTracker/>) ----
  | {
      name: 'page_view';
      params: {
        page_path: string;
        page_title?: string;
        page_location?: string;
      };
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip trailing ratio/size suffixes from product names, mirroring the
 *  logic in `cart`/`confirmation`/`checkout` pages so GA4 sees clean
 *  product names rather than "Canvas — Ratio — 12\" × 12\"". */
export function cleanProductName(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();
  const first = trimmed.split(/\s+[—–-]\s+/)[0]?.trim();
  return first || trimmed;
}

/**
 * Returns true only when (a) we're on a live photify.co hostname and
 * (b) the user has accepted the cookie banner. All vendor calls gate
 * on this — never call gtag/PostHog without checking first.
 */
function isTrackingEnabled(): boolean {
  if (!isLiveSite()) return false;
  return getConsent() === 'accepted';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire an event to every configured analytics vendor.
 *
 * No-ops when:
 *  - Running on SSR (no `window`).
 *  - Hostname isn't photify.co / www.photify.co.
 *  - User has not granted cookie consent.
 *  - The vendor SDK failed to load (try/catch swallows the error).
 */
export function track<E extends AnalyticsEvent>(event: E): void {
  if (typeof window === 'undefined') return;
  if (!isTrackingEnabled()) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.name, event.params);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[analytics] gtag failed', err);
  }

  try {
    capturePostHogEvent(event.name, event.params as Record<string, unknown>);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[analytics] posthog failed', err);
  }
}

/**
 * Identify a known customer (e.g. after checkout) so cross-session
 * funnels work in PostHog and GA4 user_id reporting is enabled.
 */
export function identify(
  userId: string,
  traits?: { email?: string; customer_type?: 'new' | 'returning' }
): void {
  if (!isTrackingEnabled()) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('set', 'user_properties', {
        customer_type: traits?.customer_type,
      });
      window.gtag('config', 'G-36QQ67296N', { user_id: userId });
    }
  } catch {
    /* analytics must never break the app */
  }

  try {
    identifyPostHog(userId, traits);
  } catch {
    /* same */
  }
}

/** Reset session identity, e.g. on logout. */
export function reset(): void {
  if (typeof window === 'undefined') return;
  try {
    resetPostHog();
  } catch {
    /* swallow */
  }
}
