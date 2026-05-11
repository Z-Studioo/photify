import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import {
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  getDeliveryInfo,
} from '@/lib/sendgrid';
import {
  applyStatusChange,
  type OrderStatus,
} from '@/services/orderStatus';

const ALLOWED_NEXT: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

/**
 * PATCH /api/orders/:orderNumber/status
 *
 * Single source of truth for admin-driven status mutations. Centralises
 * state-machine validation, optimistic locking, audit logging, and
 * customer email side-effects (the email send is idempotent across all
 * mutation sources via `order_status_history`).
 *
 * Body:
 *   { status: OrderStatus, reason?: string, allowRevert?: boolean }
 */
export async function updateOrderStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { orderNumber } = req.params;
  const { status, reason, allowRevert } = (req.body || {}) as {
    status?: string;
    reason?: string;
    allowRevert?: boolean;
  };

  if (!orderNumber) {
    res.status(400).json({ error: 'Order number is required' });
    return;
  }
  if (!status || !ALLOWED_NEXT.has(status as OrderStatus)) {
    res.status(400).json({
      error: 'Invalid status',
      message:
        'status must be one of: pending, processing, shipped, delivered, cancelled',
    });
    return;
  }

  const actor =
    (req as any).user?.email ||
    (req as any).user?.id ||
    null;

  const result = await applyStatusChange(orderNumber, status as OrderStatus, {
    source: 'admin',
    actor,
    reason: reason || null,
    allowRevert: Boolean(allowRevert),
  });

  if (!result.ok) {
    const httpStatus =
      result.reasonCode === 'order_not_found'
        ? 404
        : result.reasonCode === 'concurrent_update'
          ? 409
          : 400;
    res.status(httpStatus).json({
      error: result.error || 'Status change rejected',
      reasonCode: result.reasonCode,
      previous_status: result.previous_status,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      order_number: orderNumber,
      previous_status: result.previous_status,
      new_status: result.new_status,
      emailSent: result.emailSent,
    },
  });
}

/**
 * POST /api/orders/:orderNumber/status-notification
 *
 * Legacy endpoint kept for compatibility — manually re-sends a customer
 * notification email without changing the order status. Useful if the
 * original send failed in SendGrid. The state mutation has already been
 * audited; this just re-fires the email.
 */
export async function sendOrderStatusNotification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!orderNumber) {
      res.status(400).json({ error: 'Order number is required' });
      return;
    }

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const shippingAddress =
      typeof order.shipping_address === 'string'
        ? order.shipping_address
        : order.shipping_address?.address || 'N/A';

    const formatDate = (date: string | Date) =>
      new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    switch (status.toLowerCase()) {
      case 'shipped':
      case 'processing': {
        const shippingCost = parseFloat(order.shipping_cost || 0);
        const deliveryInfo = getDeliveryInfo(shippingCost);
        const estimatedDelivery = new Date();
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
          dispatch_date: formatDate(new Date()),
          tracking_number: order.tracking_number || undefined,
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
            line1: shippingAddress,
            line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'United Kingdom',
          },
        });
        res.status(200).json({
          success: true,
          message: 'Order dispatched notification re-sent',
        });
        break;
      }

      case 'delivered': {
        const shippingCost = parseFloat(order.shipping_cost || 0);
        const deliveryInfo = getDeliveryInfo(shippingCost);

        await sendOrderDeliveredEmail({
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          order_number: order.order_number,
          delivery_date: formatDate(order.delivered_at || new Date()),
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
        res.status(200).json({
          success: true,
          message: 'Order delivered notification re-sent',
        });
        break;
      }

      case 'cancelled': {
        const cancelledData = {
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          order_number: order.order_number,
          order_date: formatDate(order.created_at),
          cancellation_date: formatDate(new Date()),
          cancellation_reason:
            order.remarks || 'Order cancelled as per request',
          refund_amount: `£${parseFloat(order.total).toFixed(2)}`,
          refund_method: order.payment_method || 'Original payment method',
          refund_processing_time: '3–5 business days',
          subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
          shipping_cost: `£${parseFloat(order.shipping_cost || 0).toFixed(2)}`,
          total_amount: `£${parseFloat(order.total).toFixed(2)}`,
          order_items: (order.items || []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity || 1,
            price: `£${parseFloat(item.price).toFixed(2)}`,
          })),
        };

        await sendOrderCancelledEmail(cancelledData);
        res.status(200).json({
          success: true,
          message: 'Order cancellation notification re-sent',
        });
        break;
      }

      default:
        res.status(400).json({
          error: 'Invalid status for notification',
          message:
            'Status must be one of: processing, shipped, delivered, cancelled',
        });
        return;
    }
  } catch (error: any) {
    console.error('Error sending order status notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message,
    });
  }
}
