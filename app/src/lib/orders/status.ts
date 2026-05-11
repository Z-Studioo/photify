/**
 * Shared order status vocabulary used by both the admin list page and
 * detail page. Single source of truth for:
 *   - canonical DB statuses
 *   - customer-facing labels
 *   - badge colour classes (Tailwind)
 *
 * The mapping mirrors the backend state machine in
 * `server/src/services/orderStatus.ts`.
 */

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_FLOW: ReadonlyArray<
  Exclude<OrderStatus, 'cancelled'>
> = ['pending', 'processing', 'shipped', 'delivered'] as const;

/**
 * Customer-facing labels — keep these in sync with email templates.
 * `processing` is presented as "Payment Confirmed" everywhere because
 * the only thing that puts an order into `processing` is a successful
 * Stripe charge.
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Payment Confirmed',
  shipped: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function normaliseStatus(raw: string | null | undefined): OrderStatus {
  const lower = (raw || 'pending').toLowerCase();
  if (
    lower === 'pending' ||
    lower === 'processing' ||
    lower === 'shipped' ||
    lower === 'delivered' ||
    lower === 'cancelled'
  ) {
    return lower;
  }
  return 'pending';
}

export function statusLabel(status: string | null | undefined): string {
  return ORDER_STATUS_LABEL[normaliseStatus(status)];
}

export function statusBadgeClass(status: string | null | undefined): string {
  return ORDER_STATUS_BADGE_CLASS[normaliseStatus(status)];
}

export function nextStatus(current: OrderStatus): OrderStatus {
  const idx = ORDER_STATUS_FLOW.indexOf(
    current as Exclude<OrderStatus, 'cancelled'>
  );
  if (idx === -1) return current;
  return ORDER_STATUS_FLOW[idx + 1] ?? current;
}

export function previousStatus(current: OrderStatus): OrderStatus {
  const idx = ORDER_STATUS_FLOW.indexOf(
    current as Exclude<OrderStatus, 'cancelled'>
  );
  if (idx <= 0) return current;
  return ORDER_STATUS_FLOW[idx - 1] ?? current;
}

/**
 * Label for the "advance" button on the detail page — always describes
 * the *next* state in plain English.
 */
export function nextActionLabel(current: OrderStatus): string {
  switch (current) {
    case 'pending':
      return 'Mark as Payment Confirmed';
    case 'processing':
      return 'Mark as Dispatched';
    case 'shipped':
      return 'Mark as Delivered';
    default:
      return 'Next Status';
  }
}
