/**
 * Order status mutation service.
 *
 * All order status changes (admin manual, Stripe webhook, Parcel2Go
 * automation, system cancellation) MUST go through this module. It:
 *
 *   1. Validates the requested transition against a hand-rolled state
 *      machine so admins can't accidentally jump states or downgrade a
 *      cancelled/delivered order.
 *   2. Writes the audit row in `order_status_history` before/after the DB
 *      update so we always have a trace, even if the email send fails.
 *   3. Decides whether to fire the customer notification email by
 *      consulting the audit table — idempotent across retries.
 *   4. Returns a structured result the callers can surface to admins or
 *      log in webhook handlers.
 *
 * The state machine intentionally matches the customer-facing vocabulary:
 *
 *   pending → processing → shipped → delivered
 *                              ↓
 *                          cancelled   (allowed from any non-terminal state)
 */
import { supabase } from '@/lib/supabase';
import {
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  getDeliveryInfo,
} from '@/lib/sendgrid';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type StatusChangeSource =
  | 'admin'
  | 'stripe'
  | 'parcel2go-webhook'
  | 'parcel2go-sync'
  | 'parcel2go-cron'
  | 'system';

const TERMINAL: ReadonlySet<OrderStatus> = new Set(['delivered', 'cancelled']);

/**
 * Whitelisted forward transitions. Reverse transitions (admin "Revert
 * Status") are allowed within the linear flow but bypass email side-effects
 * — see `applyStatusChange`.
 */
const FORWARD_TRANSITIONS: Readonly<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const REVERSE_TRANSITIONS: Readonly<Record<OrderStatus, OrderStatus[]>> = {
  pending: [],
  processing: ['pending'],
  shipped: ['processing'],
  delivered: ['shipped'],
  cancelled: [],
};

export interface StatusChangeOptions {
  source: StatusChangeSource;
  /** Admin user id / email or webhook delivery id — purely informational. */
  actor?: string | null;
  /** Free-form reason (cancellation reason, etc.). */
  reason?: string | null;
  /** When set, persisted in the audit row for forensics. */
  metadata?: Record<string, unknown> | null;
  /**
   * Allow stepping backward in the linear flow (e.g. admin "Revert Status").
   * No customer email is sent on a revert.
   */
  allowRevert?: boolean;
  /**
   * Skip email side-effects entirely. Used by Parcel2Go sync which sends
   * its own bespoke emails via `applyStageTransition`.
   */
  skipEmail?: boolean;
  /**
   * Additional columns to set in the same UPDATE (e.g. `shipped_at`,
   * `delivered_at`, `cancelled_at`). The service auto-fills timestamps for
   * the canonical transitions but callers may override.
   */
  extraUpdate?: Record<string, unknown>;
}

export interface StatusChangeResult {
  ok: boolean;
  previous_status: OrderStatus | null;
  new_status: OrderStatus | null;
  /** True if the customer notification email was sent as part of this call. */
  emailSent: boolean;
  /** Set when `ok=false`. */
  error?: string;
  /** Hint for the client about why a transition was rejected. */
  reasonCode?:
    | 'invalid_transition'
    | 'already_in_state'
    | 'order_not_found'
    | 'concurrent_update'
    | 'parcel2go_blocked'
    | 'payment_not_confirmed';
}

function isValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  allowRevert: boolean
): boolean {
  if (from === to) return false;
  const forward = FORWARD_TRANSITIONS[from] || [];
  if (forward.includes(to)) return true;
  if (allowRevert) {
    const reverse = REVERSE_TRANSITIONS[from] || [];
    return reverse.includes(to);
  }
  return false;
}

interface OrderRow {
  order_number: string;
  status: OrderStatus;
  payment_status?: string | null;
  parcel2go_order_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  created_at?: string;
  shipping_address?: unknown;
  shipping_cost?: string | number | null;
  subtotal?: string | number | null;
  total?: string | number | null;
  items?: unknown;
  tracking_number?: string | null;
  delivered_at?: string | null;
  shipped_at?: string | null;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function recordHistory(row: {
  order_number: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  source: StatusChangeSource;
  actor?: string | null;
  reason?: string | null;
  email_sent: boolean;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const { error } = await supabase.from('order_status_history').insert({
    order_number: row.order_number,
    previous_status: row.previous_status,
    new_status: row.new_status,
    source: row.source,
    actor: row.actor || null,
    reason: row.reason || null,
    email_sent: row.email_sent,
    metadata: row.metadata || null,
  });
  if (error) {
    // Audit failures don't roll back the status change — but they must be
    // visible in the server logs so we can backfill.
    console.error(
      `[order-status] failed to write audit row for ${row.order_number}`,
      error
    );
  }
}

/**
 * Has the customer already been emailed for this status by any source?
 * We use the audit log as the source of truth so admin + Parcel2Go +
 * Stripe never double-send.
 */
async function alreadyEmailedFor(
  orderNumber: string,
  status: OrderStatus
): Promise<boolean> {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('id')
    .eq('order_number', orderNumber)
    .eq('new_status', status)
    .eq('email_sent', true)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(
      `[order-status] failed to check email history for ${orderNumber}`,
      error
    );
    // Be conservative — assume not sent so we don't silently drop a
    // legitimate notification.
    return false;
  }
  return Boolean(data);
}

async function sendDispatchedEmailSafe(order: OrderRow): Promise<boolean> {
  try {
    const shippingAddressLine =
      typeof order.shipping_address === 'string'
        ? order.shipping_address
        : (order.shipping_address as any)?.address || 'N/A';
    const shippingCost = parseFloat(String(order.shipping_cost ?? '0'));
    const deliveryInfo = getDeliveryInfo(shippingCost);
    const estimatedDelivery = new Date();
    const daysToAdd =
      deliveryInfo.delivery_type === 'Express Shipping' ? 3 : 7;
    estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToAdd);

    await sendOrderDispatchedEmail({
      customer_name: order.customer_name || 'Customer',
      customer_email: order.customer_email || '',
      order_number: order.order_number,
      order_date: formatDate(order.created_at || new Date().toISOString()),
      delivery_type: deliveryInfo.delivery_type,
      estimated_delivery: formatDate(estimatedDelivery),
      dispatch_date: formatDate(new Date()),
      ...(order.tracking_number
        ? { tracking_number: order.tracking_number }
        : {}),
      shipping_cost: `£${shippingCost.toFixed(2)}`,
      subtotal: `£${parseFloat(String(order.subtotal ?? '0')).toFixed(2)}`,
      total_amount: `£${parseFloat(String(order.total ?? '0')).toFixed(2)}`,
      order_items: (Array.isArray(order.items) ? order.items : []).map(
        (item: any) => ({
          name: item.name,
          ...(item.size || item.variant
            ? { variant: item.size || item.variant }
            : {}),
          quantity: item.quantity || 1,
          price: `£${parseFloat(item.price).toFixed(2)}`,
        })
      ),
      shipping_address: {
        name: order.customer_name || '',
        line1: shippingAddressLine,
        line2: '',
        city: '',
        state: '',
        postal_code:
          (typeof order.shipping_address === 'object'
            ? (order.shipping_address as any)?.postcode
            : '') || '',
        country: 'United Kingdom',
      },
    });
    return true;
  } catch (err) {
    console.error(
      `[order-status] dispatched email failed for ${order.order_number}`,
      err
    );
    return false;
  }
}

async function sendDeliveredEmailSafe(order: OrderRow): Promise<boolean> {
  try {
    const shippingAddressLine =
      typeof order.shipping_address === 'string'
        ? order.shipping_address
        : (order.shipping_address as any)?.address || 'N/A';
    const shippingCost = parseFloat(String(order.shipping_cost ?? '0'));
    const deliveryInfo = getDeliveryInfo(shippingCost);

    await sendOrderDeliveredEmail({
      customer_name: order.customer_name || 'Customer',
      customer_email: order.customer_email || '',
      order_number: order.order_number,
      delivery_date: formatDate(order.delivered_at || new Date()),
      delivery_address: shippingAddressLine,
      delivery_type: deliveryInfo.delivery_type,
      estimated_delivery: deliveryInfo.estimated_days,
      subtotal: `£${parseFloat(String(order.subtotal ?? '0')).toFixed(2)}`,
      shipping_cost: `£${shippingCost.toFixed(2)}`,
      total_amount: `£${parseFloat(String(order.total ?? '0')).toFixed(2)}`,
      order_items: (Array.isArray(order.items) ? order.items : []).map(
        (item: any) => ({
          name: item.name,
          variant: item.size || item.variant || null,
          quantity: item.quantity || 1,
          price: `£${parseFloat(item.price).toFixed(2)}`,
        })
      ),
    });
    return true;
  } catch (err) {
    console.error(
      `[order-status] delivered email failed for ${order.order_number}`,
      err
    );
    return false;
  }
}

/**
 * Send the email associated with the given status, *idempotently*. The
 * audit table is the source of truth — if we've previously emailed the
 * customer for this status, this call is a no-op.
 */
export async function notifyCustomerForStatus(
  order: OrderRow,
  status: OrderStatus
): Promise<boolean> {
  if (status !== 'shipped' && status !== 'delivered') return false;
  const already = await alreadyEmailedFor(order.order_number, status);
  if (already) return false;
  if (status === 'shipped') return sendDispatchedEmailSafe(order);
  return sendDeliveredEmailSafe(order);
}

/**
 * Mutate an order's status with full guarding + audit + idempotent email.
 */
export async function applyStatusChange(
  orderNumber: string,
  next: OrderStatus,
  opts: StatusChangeOptions
): Promise<StatusChangeResult> {
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (fetchErr || !order) {
    return {
      ok: false,
      previous_status: null,
      new_status: null,
      emailSent: false,
      error: 'Order not found',
      reasonCode: 'order_not_found',
    };
  }

  const previous = (order.status || 'pending') as OrderStatus;

  if (previous === next) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: `Order is already in ${next}`,
      reasonCode: 'already_in_state',
    };
  }

  // Terminal states are immovable from anywhere except the admin
  // "Revert from delivered" path, which is explicitly opt-in.
  if (TERMINAL.has(previous) && !opts.allowRevert) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: `Cannot transition from ${previous}`,
      reasonCode: 'invalid_transition',
    };
  }

  if (!isValidTransition(previous, next, Boolean(opts.allowRevert))) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: `Invalid transition ${previous} → ${next}`,
      reasonCode: 'invalid_transition',
    };
  }

  // For admin-driven transitions, refuse to advance an unpaid order beyond
  // pending. Stripe webhook drives pending → processing automatically.
  if (
    opts.source === 'admin' &&
    previous === 'pending' &&
    next === 'processing' &&
    (order.payment_status || 'pending') !== 'paid'
  ) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: 'Cannot mark payment as confirmed — Stripe has not reported a successful charge yet.',
      reasonCode: 'payment_not_confirmed',
    };
  }

  // When a Parcel2Go shipment is booked, status is owned by P2G automation.
  // Block admins from racing webhooks except for revert / cancellation.
  if (
    opts.source === 'admin' &&
    !opts.allowRevert &&
    next !== 'cancelled' &&
    order.parcel2go_order_id &&
    (previous === 'processing' || previous === 'shipped')
  ) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error:
        'A Parcel2Go shipment is booked — dispatch/delivery will be driven by tracking. Use the Shipping panel to refresh or manually sync tracking.',
      reasonCode: 'parcel2go_blocked',
    };
  }

  const update: Record<string, unknown> = {
    status: next,
    ...(opts.extraUpdate || {}),
  };

  if (next === 'shipped' && !('shipped_at' in update)) {
    update.shipped_at = new Date().toISOString();
  }
  if (next === 'delivered' && !('delivered_at' in update)) {
    update.delivered_at = new Date().toISOString();
  }
  if (next === 'cancelled' && !('cancelled_at' in update)) {
    update.cancelled_at = new Date().toISOString();
  }
  // Reverts: null out the corresponding timestamp.
  if (opts.allowRevert) {
    if (previous === 'shipped' && next === 'processing') {
      update.shipped_at = null;
    }
    if (previous === 'delivered' && next === 'shipped') {
      update.delivered_at = null;
    }
  }
  if (opts.reason) update.remarks = opts.reason;

  // Optimistic concurrency: only update if the row is still in `previous`.
  const { data: updated, error: updateErr } = await supabase
    .from('orders')
    .update(update)
    .eq('order_number', orderNumber)
    .eq('status', previous)
    .select('*')
    .maybeSingle();

  if (updateErr) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: updateErr.message,
    };
  }
  if (!updated) {
    return {
      ok: false,
      previous_status: previous,
      new_status: previous,
      emailSent: false,
      error: 'Order status changed in another session — refresh and retry.',
      reasonCode: 'concurrent_update',
    };
  }

  let emailSent = false;
  if (!opts.skipEmail && !opts.allowRevert) {
    emailSent = await notifyCustomerForStatus(updated as OrderRow, next);
  }

  await recordHistory({
    order_number: orderNumber,
    previous_status: previous,
    new_status: next,
    source: opts.source,
    actor: opts.actor ?? null,
    reason: opts.reason ?? null,
    email_sent: emailSent,
    metadata: opts.metadata ?? null,
  });

  return {
    ok: true,
    previous_status: previous,
    new_status: next,
    emailSent,
  };
}

/**
 * Record an email send against the most recent matching audit row — used
 * by Parcel2Go automation which writes its own status update and only
 * wants to mark the audit row as "email sent" idempotently.
 */
export async function markStatusEmailSent(
  orderNumber: string,
  status: OrderStatus,
  source: StatusChangeSource,
  opts?: { metadata?: Record<string, unknown> | null }
): Promise<void> {
  await recordHistory({
    order_number: orderNumber,
    previous_status: null,
    new_status: status,
    source,
    email_sent: true,
    metadata: opts?.metadata ?? null,
  });
}
