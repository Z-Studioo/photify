import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import {
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from '@/lib/sendgrid';

/**
 * POST /api/orders/:orderNumber/status-notification
 * Send order status change notification email to customer
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

    // Fetch order details from database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Format shipping address
    const shippingAddress = typeof order.shipping_address === 'string'
      ? order.shipping_address
      : order.shipping_address?.address || 'N/A';

    // Format dates
    const formatDate = (date: string | Date) =>
      new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    // Send appropriate email based on status
    switch (status.toLowerCase()) {
      case 'shipped':
      case 'processing': {
        // Calculate estimated delivery (4 days from dispatch)
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

        const dispatchData = {
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          order_number: order.order_number,
          order_date: formatDate(order.created_at),
          delivery_type: order.delivery_method || 'Standard Delivery',
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
        };

        await sendOrderDispatchedEmail(dispatchData);
        res.status(200).json({
          success: true,
          message: 'Order dispatched notification sent',
        });
        break;
      }

      case 'delivered': {
        const deliveredData = {
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          order_number: order.order_number,
          delivery_date: formatDate(order.delivered_at || new Date()),
          delivery_address: shippingAddress,
          subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
          shipping_cost: `£${parseFloat(order.shipping_cost || 0).toFixed(2)}`,
          total_amount: `£${parseFloat(order.total).toFixed(2)}`,
          order_items: (order.items || []).map((item: any) => ({
            name: item.name,
            variant: item.size || item.variant || null,
            quantity: item.quantity || 1,
            price: `£${parseFloat(item.price).toFixed(2)}`,
          })),
        };

        await sendOrderDeliveredEmail(deliveredData);
        res.status(200).json({
          success: true,
          message: 'Order delivered notification sent',
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
          message: 'Order cancellation notification sent',
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
