/**
 * Parcel2Go status automation.
 *
 * Three entry points share the same transition logic:
 *   1. Webhook receiver (`parcel2goWebhookController`) — primary, real-time.
 *   2. Periodic polling cron — safety net for missed webhooks.
 *   3. Admin "Refresh tracking" button — manual override.
 *
 * Status mapping (per product spec):
 *   - Parcel2Go Stage `DroppedOff` → Photify `shipped` + Dispatched email
 *   - Parcel2Go Stage `Delivered`  → Photify `delivered` + Delivered email
 *   - Every other stage is recorded in `tracking_stage` for visibility but
 *     does not move the order status.
 */
import cron from 'node-cron';
import {
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  getDeliveryInfo,
} from '@/lib/sendgrid';
import { supabase } from '@/lib/supabase';
import {
  parcel2go,
  isParcel2GoConfigured,
  Parcel2GoApiError,
  type TrackingResponse,
} from '@/lib/parcel2go';
import type { StatusChangeSource } from '@/services/orderStatus';

const STALE_AFTER_DAYS = 30;

const DISPATCH_STAGES = new Set<string>(['droppedoff']);
const DELIVERED_STAGES = new Set<string>(['delivered']);

export type TransitionTarget = 'shipped' | 'delivered' | 'none';

export interface TransitionResult {
  order_number: string;
  previous_status: string | null;
  new_status: string | null;
  stage: string | null;
  transitioned: TransitionTarget;
  emailSent: boolean;
  error?: string | undefined;
}

function stageToTarget(stage: string | null | undefined): TransitionTarget {
  if (!stage) return 'none';
  const s = stage.toLowerCase();
  if (DELIVERED_STAGES.has(s)) return 'delivered';
  if (DISPATCH_STAGES.has(s)) return 'shipped';
  return 'none';
}

function pickStageTimestamp(
  tracking: TrackingResponse,
  target: TransitionTarget
): string {
  if (target === 'delivered' && tracking.Delivered) {
    return new Date(tracking.Delivered).toISOString();
  }
  // Look for the most recent event whose description hints at our target.
  const events = tracking.Results || [];
  const hint = target === 'delivered' ? /deliver/i : /drop|collect/i;
  const match = [...events]
    .reverse()
    .find(e => (e.Description || '').match(hint));
  if (match?.Timestamp) return new Date(match.Timestamp).toISOString();
  return new Date().toISOString();
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function sendDispatchedEmailSafe(
  order: Record<string, any>,
  dispatchedAt: string,
  trackingNumber: string | null
): Promise<boolean> {
  try {
    const shippingAddressLine =
      typeof order.shipping_address === 'string'
        ? order.shipping_address
        : order.shipping_address?.address || 'N/A';
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const deliveryInfo = getDeliveryInfo(shippingCost);
    const estimatedDelivery = new Date(dispatchedAt);
    const daysToAdd =
      deliveryInfo.delivery_type === 'Express Shipping' ? 3 : 7;
    estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToAdd);

    await sendOrderDispatchedEmail({
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_number: order.order_number,
      order_date: formatDate(order.created_at),
      delivery_type: deliveryInfo.delivery_type,
      estimated_delivery: formatDate(estimatedDelivery),
      dispatch_date: formatDate(dispatchedAt),
      tracking_number: trackingNumber || order.tracking_number || undefined,
      shipping_cost: `£${parseFloat(order.shipping_cost || 0).toFixed(2)}`,
      subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
      total_amount: `£${parseFloat(order.total).toFixed(2)}`,
      order_items: (order.items || []).map((item: any) => ({
        name: item.name,
        variant: item.size || item.variant || undefined,
        quantity: item.quantity || 1,
        price: `£${parseFloat(item.price).toFixed(2)}`,
      })),
      shipping_address: {
        name: order.customer_name,
        line1: shippingAddressLine,
        line2: '',
        city: '',
        state: '',
        postal_code:
          (typeof order.shipping_address === 'object'
            ? order.shipping_address?.postcode
            : '') || '',
        country: 'United Kingdom',
      },
    });
    return true;
  } catch (err) {
    console.error(
      `[parcel2go-sync] dispatched email failed for ${order.order_number}`,
      err
    );
    return false;
  }
}

async function sendDeliveredEmailSafe(
  order: Record<string, any>,
  deliveredAt: string
): Promise<boolean> {
  try {
    const shippingAddress =
      typeof order.shipping_address === 'string'
        ? order.shipping_address
        : order.shipping_address?.address || 'N/A';
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const deliveryInfo = getDeliveryInfo(shippingCost);

    await sendOrderDeliveredEmail({
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_number: order.order_number,
      delivery_date: formatDate(deliveredAt),
      delivery_address: shippingAddress,
      delivery_type: deliveryInfo.delivery_type,
      estimated_delivery: deliveryInfo.estimated_days,
      subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
      shipping_cost: `£${parseFloat(order.shipping_cost || 0).toFixed(2)}`,
      total_amount: `£${parseFloat(order.total).toFixed(2)}`,
      order_items: (order.items || []).map((item: any) => ({
        name: item.name,
        variant: item.size || item.variant || null,
        quantity: item.quantity || 1,
        price: `£${parseFloat(item.price).toFixed(2)}`,
      })),
    });
    return true;
  } catch (err) {
    console.error(
      `[parcel2go-sync] delivered email failed for ${order.order_number}`,
      err
    );
    return false;
  }
}

const ORDER_SELECT =
  'order_number, parcel2go_order_id, parcel2go_orderline_id, parcel2go_hash, status, tracking_stage, tracking_number, shipped_at, delivered_at, customer_email, customer_name, shipping_address, items, subtotal, total, shipping_cost, created_at, carrier_name, service_name';

/**
 * Has the customer already been emailed for this status, regardless of
 * which subsystem sent it? Source of truth is `order_status_history`.
 */
async function emailAlreadySent(
  orderNumber: string,
  newStatus: string
): Promise<boolean> {
  const { data } = await supabase
    .from('order_status_history')
    .select('id')
    .eq('order_number', orderNumber)
    .eq('new_status', newStatus)
    .eq('email_sent', true)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function writeAudit(row: {
  orderNumber: string;
  previousStatus: string | null;
  newStatus: string;
  source: StatusChangeSource;
  emailSent: boolean;
  stage: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const { error } = await supabase.from('order_status_history').insert({
    order_number: row.orderNumber,
    previous_status: row.previousStatus,
    new_status: row.newStatus,
    source: row.source,
    email_sent: row.emailSent,
    metadata: {
      stage: row.stage,
      ...(row.metadata || {}),
    },
  });
  if (error) {
    console.error(
      `[parcel2go-sync] audit insert failed for ${row.orderNumber}`,
      error
    );
  }
}

/**
 * Apply a stage to an order, writing through to DB + (idempotently) firing
 * the matching customer email. Safe to call from webhook + cron + manual sync.
 *
 * `source` lets callers tag the audit row so we can tell webhook-driven,
 * cron-driven, and manual syncs apart.
 */
export async function applyStageTransition(
  order: Record<string, any>,
  stage: string | null,
  opts: {
    stageTimestamp?: string;
    trackingNumber?: string | null;
    persistStage?: boolean;
    source?: StatusChangeSource;
  } = {}
): Promise<TransitionResult> {
  const previous = order.status as string | null;
  const target = stageToTarget(stage);
  const source: StatusChangeSource = opts.source || 'parcel2go-sync';
  const baseUpdate: Record<string, unknown> = {
    tracking_last_synced_at: new Date().toISOString(),
  };
  if (opts.persistStage !== false && stage) {
    baseUpdate['tracking_stage'] = stage;
  }
  if (opts.trackingNumber) {
    baseUpdate['tracking_number'] = opts.trackingNumber;
  }

  // Cancelled orders are terminal. Refresh tracking metadata for visibility
  // but never re-advance the status — admin already issued the refund.
  if (previous === 'cancelled') {
    await supabase
      .from('orders')
      .update(baseUpdate)
      .eq('order_number', order.order_number);
    return {
      order_number: order.order_number,
      previous_status: previous,
      new_status: previous,
      stage,
      transitioned: 'none',
      emailSent: false,
    };
  }

  if (target === 'none') {
    await supabase
      .from('orders')
      .update(baseUpdate)
      .eq('order_number', order.order_number);
    return {
      order_number: order.order_number,
      previous_status: previous,
      new_status: previous,
      stage,
      transitioned: 'none',
      emailSent: false,
    };
  }

  if (target === 'shipped') {
    // Don't downgrade a delivered order, or re-fire on a re-arrival of
    // the same stage.
    if (previous === 'delivered' || previous === 'shipped') {
      await supabase
        .from('orders')
        .update(baseUpdate)
        .eq('order_number', order.order_number);
      return {
        order_number: order.order_number,
        previous_status: previous,
        new_status: previous,
        stage,
        transitioned: 'none',
        emailSent: false,
      };
    }
    const dispatchedAt = opts.stageTimestamp || new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        ...baseUpdate,
        status: 'shipped',
        shipped_at: dispatchedAt,
      })
      .eq('order_number', order.order_number)
      // Optimistic lock against concurrent admin mutations.
      .eq('status', previous as string)
      .select('order_number')
      .maybeSingle();
    if (error || !updated) {
      return {
        order_number: order.order_number,
        previous_status: previous,
        new_status: previous,
        stage,
        transitioned: 'none',
        emailSent: false,
        ...(error ? { error: error.message } : {}),
      };
    }
    const wasEmailed = await emailAlreadySent(order.order_number, 'shipped');
    const emailSent = wasEmailed
      ? false
      : await sendDispatchedEmailSafe(
          order,
          dispatchedAt,
          opts.trackingNumber || order.tracking_number || null
        );
    await writeAudit({
      orderNumber: order.order_number,
      previousStatus: previous,
      newStatus: 'shipped',
      source,
      emailSent: wasEmailed || emailSent,
      stage,
    });
    return {
      order_number: order.order_number,
      previous_status: previous,
      new_status: 'shipped',
      stage,
      transitioned: 'shipped',
      emailSent,
    };
  }

  // target === 'delivered'
  if (previous === 'delivered') {
    await supabase
      .from('orders')
      .update(baseUpdate)
      .eq('order_number', order.order_number);
    return {
      order_number: order.order_number,
      previous_status: previous,
      new_status: previous,
      stage,
      transitioned: 'none',
      emailSent: false,
    };
  }
  const deliveredAt = opts.stageTimestamp || new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      ...baseUpdate,
      status: 'delivered',
      delivered_at: deliveredAt,
      // If we never saw DroppedOff (e.g. webhook missed) but the parcel is
      // marked delivered, backfill shipped_at so reports remain consistent.
      shipped_at: order.shipped_at || deliveredAt,
    })
    .eq('order_number', order.order_number)
    .eq('status', previous as string)
    .select('order_number')
    .maybeSingle();
  if (error || !updated) {
    return {
      order_number: order.order_number,
      previous_status: previous,
      new_status: previous,
      stage,
      transitioned: 'none',
      emailSent: false,
      ...(error ? { error: error.message } : {}),
    };
  }
  const wasEmailed = await emailAlreadySent(order.order_number, 'delivered');
  const emailSent = wasEmailed
    ? false
    : await sendDeliveredEmailSafe(order, deliveredAt);
  await writeAudit({
    orderNumber: order.order_number,
    previousStatus: previous,
    newStatus: 'delivered',
    source,
    emailSent: wasEmailed || emailSent,
    stage,
  });
  return {
    order_number: order.order_number,
    previous_status: previous,
    new_status: 'delivered',
    stage,
    transitioned: 'delivered',
    emailSent,
  };
}

/**
 * Fetch tracking from Parcel2Go and apply the resulting stage to the given
 * order. Returns the transition result.
 */
export async function syncOneOrderTracking(
  order: Record<string, any>,
  opts: { source?: StatusChangeSource } = {}
): Promise<TransitionResult> {
  const ref =
    order.parcel2go_orderline_id ||
    order.parcel2go_order_id ||
    order.tracking_number;
  if (!ref) {
    return {
      order_number: order.order_number,
      previous_status: order.status || null,
      new_status: order.status || null,
      stage: null,
      transitioned: 'none',
      emailSent: false,
      error: 'No Parcel2Go reference on order',
    };
  }

  try {
    const tracking = await parcel2go.getTracking(ref);
    const stage = tracking.Stage || null;
    const target = stageToTarget(stage);
    const stageTimestamp =
      target !== 'none' ? pickStageTimestamp(tracking, target) : undefined;
    const trackingNumber = tracking.TrackingNumber || order.tracking_number;

    return applyStageTransition(order, stage, {
      ...(stageTimestamp ? { stageTimestamp } : {}),
      trackingNumber,
      ...(opts.source ? { source: opts.source } : {}),
    });
  } catch (err) {
    const message =
      err instanceof Parcel2GoApiError
        ? `${err.status} ${err.message}`
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    return {
      order_number: order.order_number,
      previous_status: order.status || null,
      new_status: order.status || null,
      stage: null,
      transitioned: 'none',
      emailSent: false,
      error: message,
    };
  }
}

/**
 * Look up an order by Photify order_number and refresh its tracking.
 * Used by the admin "Refresh tracking" button and the manual sync route.
 */
export async function syncOrderByNumber(
  orderNumber: string,
  opts: { source?: StatusChangeSource } = {}
): Promise<TransitionResult | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('order_number', orderNumber)
    .single();
  if (error || !order) return null;
  return syncOneOrderTracking(order, opts);
}

/**
 * Look up an order by Parcel2Go OrderLineId / CustomerReference and refresh
 * tracking. Used by the webhook controller. Either identifier is accepted.
 */
export async function syncOrderByParcel2GoRef(opts: {
  orderlineId?: string | null;
  customerReference?: string | null;
  source?: StatusChangeSource;
}): Promise<TransitionResult | null> {
  const { orderlineId, customerReference, source } = opts;
  let order: Record<string, any> | null = null;
  if (orderlineId) {
    const { data } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('parcel2go_orderline_id', String(orderlineId))
      .maybeSingle();
    order = data || null;
  }
  if (!order && customerReference) {
    const { data } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('order_number', customerReference)
      .maybeSingle();
    order = data || null;
  }
  if (!order) return null;
  return syncOneOrderTracking(order, source ? { source } : {});
}

// ---------- Polling cron (safety net) ----------

export interface SyncSweepResult {
  scanned: number;
  shipped: number;
  delivered: number;
  errors: number;
  details: TransitionResult[];
}

async function fetchOrdersForSweep(opts: {
  since?: Date;
  until?: Date;
}): Promise<Array<Record<string, any>>> {
  let query = supabase
    .from('orders')
    .select(ORDER_SELECT)
    .not('parcel2go_order_id', 'is', null)
    .in('status', ['pending', 'processing', 'shipped'])
    .order('created_at', { ascending: false });

  if (opts.since) {
    query = query.gte('created_at', opts.since.toISOString());
  }
  if (opts.until) {
    query = query.lt('created_at', opts.until.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error('[parcel2go-sync] Failed to fetch orders for sweep', error);
    return [];
  }
  return data || [];
}

export async function sweepShipmentStatuses(
  opts: { windowHours?: number; olderThanHours?: number } = {}
): Promise<SyncSweepResult> {
  if (!isParcel2GoConfigured()) {
    return { scanned: 0, shipped: 0, delivered: 0, errors: 0, details: [] };
  }
  const now = Date.now();
  const since = opts.windowHours
    ? new Date(now - opts.windowHours * 60 * 60 * 1000)
    : new Date(now - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const until = opts.olderThanHours
    ? new Date(now - opts.olderThanHours * 60 * 60 * 1000)
    : undefined;

  const orders = await fetchOrdersForSweep({
    since,
    ...(until ? { until } : {}),
  });
  const result: SyncSweepResult = {
    scanned: orders.length,
    shipped: 0,
    delivered: 0,
    errors: 0,
    details: [],
  };
  // Sequential to avoid hammering the API.
  for (const order of orders) {
    const detail = await syncOneOrderTracking(order, {
      source: 'parcel2go-cron',
    });
    result.details.push(detail);
    if (detail.error) result.errors += 1;
    if (detail.transitioned === 'shipped') result.shipped += 1;
    if (detail.transitioned === 'delivered') result.delivered += 1;
  }
  return result;
}

let cronStarted = false;

/**
 * Webhooks are primary; the cron is a safety net for missed deliveries.
 * Cadence:
 *   - every 30 min: orders created in the last 24h (likely in transit)
 *   - hourly      : orders created 24h–30 days ago (slow burn)
 */
export function startShipmentStatusCron(): void {
  if (cronStarted) return;
  cronStarted = true;
  // eslint-disable-next-line no-console
  console.log('[parcel2go-sync] Scheduling tracking polling (safety net)');

  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await sweepShipmentStatuses({ windowHours: 24 });
      if (result.scanned > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[parcel2go-sync] fresh sweep: scanned=${result.scanned} shipped=${result.shipped} delivered=${result.delivered} errors=${result.errors}`
        );
      }
    } catch (err) {
      console.error('[parcel2go-sync] fresh sweep failed', err);
    }
  });

  cron.schedule('11 * * * *', async () => {
    try {
      const result = await sweepShipmentStatuses({ olderThanHours: 24 });
      if (result.scanned > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[parcel2go-sync] aged sweep: scanned=${result.scanned} shipped=${result.shipped} delivered=${result.delivered} errors=${result.errors}`
        );
      }
    } catch (err) {
      console.error('[parcel2go-sync] aged sweep failed', err);
    }
  });
}
