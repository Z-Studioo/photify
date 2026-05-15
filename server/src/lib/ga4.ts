/**
 * Server-side GA4 reporting via Measurement Protocol.
 *
 * Why this exists: the client `purchase` event fires from
 * `/confirmation`, which adblockers and privacy browsers routinely
 * suppress. That's bad — revenue is the most important data point we
 * have. Firing the same event from the Stripe webhook gives us a
 * server-side source of truth that's immune to client tampering.
 *
 * Deduplication: GA4 dedupes by `transaction_id` automatically as long
 * as both the client and server use the same value. We use the Stripe
 * `payment_intent.id`, which is identical in both contexts.
 *
 * Live-site gate: only `PUBLIC_APP_URL` containing `photify.co`
 * triggers sending. Render preview deploys (which override
 * `PUBLIC_APP_URL`) and local dev never reach Google.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

import { createHash, randomUUID } from 'crypto';

const MEASUREMENT_PROTOCOL_URL = 'https://www.google-analytics.com/mp/collect';

/**
 * `client_id` is required by Measurement Protocol. In GA4 it's the
 * anonymous browser-side `_ga` cookie value. The webhook has no access
 * to that cookie, so we fabricate a stable one from the customer email
 * — same customer, same client_id, so GA4 sessions still stitch
 * together. Non-email events fall back to a random UUID so we still
 * report something.
 */
function clientIdFromEmail(email?: string | null): string {
  if (email) {
    return createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 32);
  }
  return randomUUID();
}

function isLiveDeploy(): boolean {
  const url = process.env.PUBLIC_APP_URL ?? '';
  // Only send when PUBLIC_APP_URL is the canonical apex/www. This
  // explicitly excludes Render preview URLs (*.onrender.com), localhost,
  // and any staging domain. Bracket the check tightly: a careless
  // includes('photify.co') would let a hypothetical
  // staging.photify.co.example.com slip through.
  try {
    const host = new URL(url).hostname;
    return host === 'photify.co' || host === 'www.photify.co';
  } catch {
    return false;
  }
}

function isConfigured(): boolean {
  return Boolean(
    process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET
  );
}

interface SendOptions {
  /** Email — used to derive a stable client_id. */
  customerEmail?: string | null | undefined;
  /** Optional client_id override (e.g. from request cookies in future). */
  clientId?: string | undefined;
  /** GA4 user_id for known-customer reporting. */
  userId?: string | undefined;
  /** Event name and parameters. */
  event: { name: string; params: Record<string, unknown> };
}

/**
 * Fire a single event to GA4 via Measurement Protocol. Returns silently
 * on any error — analytics MUST NOT break a Stripe webhook handler.
 *
 * No-ops outside the live deploy or when env vars are missing.
 */
export async function sendGa4Event(opts: SendOptions): Promise<void> {
  if (!isLiveDeploy()) return;
  if (!isConfigured()) {
    console.warn('[ga4] Skipping event: GA4_MEASUREMENT_ID / GA4_API_SECRET not set');
    return;
  }

  const measurementId = process.env.GA4_MEASUREMENT_ID as string;
  const apiSecret = process.env.GA4_API_SECRET as string;

  const url =
    `${MEASUREMENT_PROTOCOL_URL}` +
    `?measurement_id=${encodeURIComponent(measurementId)}` +
    `&api_secret=${encodeURIComponent(apiSecret)}`;

  const body: Record<string, unknown> = {
    client_id: opts.clientId ?? clientIdFromEmail(opts.customerEmail),
    non_personalized_ads: false,
    events: [opts.event],
  };
  if (opts.userId) body.user_id = opts.userId;

  try {
    // Node 18+ has a global fetch; the server's tsconfig targets modern
    // ESM so this works without a polyfill. Keep the call fire-and-
    // forget so the webhook's 200 response isn't blocked on Google.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[ga4] Measurement Protocol returned ${res.status}`);
    }
  } catch (err) {
    console.warn('[ga4] Failed to send event:', err);
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers for the events we actually fire from the server
// ---------------------------------------------------------------------------

interface OrderForAnalytics {
  stripe_payment_intent_id?: string | null;
  customer_email?: string | null;
  total?: string | number | null;
  subtotal?: string | number | null;
  shipping_cost?: string | number | null;
  tax?: string | number | null;
  discount?: string | number | null;
  promo_code?: string | null;
  items?: Array<{
    id?: string | number;
    name?: string;
    size?: string;
    variant?: string;
    price?: string | number;
    quantity?: number;
    product_type?: string;
  }> | null;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function stripNameSuffix(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  return trimmed.split(/\s+[—–-]\s+/)[0]?.trim() || trimmed;
}

/** Fire the GA4 `purchase` event from the Stripe webhook. */
export async function trackPurchase(order: OrderForAnalytics): Promise<void> {
  const transactionId = order.stripe_payment_intent_id;
  if (!transactionId) {
    // No Stripe PI id = no way to dedupe against the client event. Skip
    // rather than risk double-counting revenue.
    console.warn('[ga4] trackPurchase skipped: no payment_intent_id');
    return;
  }

  const items = (order.items ?? []).map((item, idx) => ({
    item_id: String(item.id ?? `line_${idx}`),
    item_name: stripNameSuffix(item.name),
    item_variant: item.size ?? item.variant,
    item_category: item.product_type,
    price: num(item.price),
    quantity: item.quantity ?? 1,
  }));

  await sendGa4Event({
    customerEmail: order.customer_email,
    event: {
      name: 'purchase',
      params: {
        transaction_id: transactionId,
        currency: 'GBP',
        value: num(order.total),
        tax: num(order.tax),
        shipping: num(order.shipping_cost),
        coupon: order.promo_code ?? undefined,
        items,
      },
    },
  });
}

/** Fire the GA4 `refund` event when Stripe reports a refund. */
export async function trackRefund(
  order: OrderForAnalytics,
  refundAmount: number
): Promise<void> {
  const transactionId = order.stripe_payment_intent_id;
  if (!transactionId) return;

  await sendGa4Event({
    customerEmail: order.customer_email,
    event: {
      name: 'refund',
      params: {
        transaction_id: transactionId,
        currency: 'GBP',
        value: refundAmount,
      },
    },
  });
}
