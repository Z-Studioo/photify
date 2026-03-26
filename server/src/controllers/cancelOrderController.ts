import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { sendOrderCancelledEmail } from '@/lib/sendgrid';

/**
 * POST /api/orders/:orderNumber/cancel
 * Cancel an order and issue refund through Stripe
 */
export async function cancelOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;

    if (!orderNumber) {
      res.status(400).json({ error: 'Order number is required' });
      return;
    }

    // Fetch order details from database
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if order is already cancelled
    if (order.status === 'cancelled') {
      res.status(400).json({ error: 'Order is already cancelled' });
      return;
    }

    // Check if order can be cancelled (only paid orders can be refunded)
    if (order.payment_status !== 'paid') {
      res.status(400).json({
        error: 'Order cannot be cancelled - payment not completed'
      });
      return;
    }

    // Check if order has a payment intent ID
    if (!order.stripe_payment_intent_id) {
      res.status(400).json({
        error: 'Order cannot be cancelled - no payment intent found'
      });
      return;
    }

    let refundAmount = parseFloat(order.total);
    let refundCurrency = 'gbd'; // Default

    try {
      // First, get the payment intent to check its current status and amount
      const paymentIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );

      refundAmount = paymentIntent.amount / 100; // Convert from cents to pounds
      refundCurrency = paymentIntent.currency.toUpperCase();

      // Check if payment intent status allows cancellation
      if (!['succeeded', 'requires_capture', 'requires_payment_method'].includes(paymentIntent.status)) {
        res.status(400).json({
          error: `Cannot cancel order with payment status: ${paymentIntent.status}`
        });
        return;
      }

      // Handle different payment intent statuses
      if (paymentIntent.status === 'requires_capture') {
        // Payment not yet captured - cancel the payment intent
        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
        console.log(`Cancelled uncaptured payment intent: ${order.stripe_payment_intent_id}`);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment already captured - issue a refund
        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: paymentIntent.amount, // Refund full amount
          reason: 'requested_by_customer',
          metadata: {
            order_number: orderNumber,
            cancellation_reason: reason || 'Order cancelled by admin'
          }
        });
        console.log(`Refund issued: ${refund.id} for order: ${orderNumber}`);
      }
    } catch (stripeError: any) {
      console.error('Stripe error during cancellation:', stripeError);
      res.status(500).json({
        error: 'Failed to process cancellation with Stripe',
        details: stripeError.message
      });
      return;
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: new Date().toISOString(),
        remarks: reason || order.remarks || 'Order cancelled by admin',
      })
      .eq('order_number', orderNumber);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      res.status(500).json({
        error: 'Failed to update order status',
        details: updateError.message
      });
      return;
    }

    // Send cancellation email to customer
    try {
      const shippingCost = parseFloat(order.shipping_cost || 0);
      const cancelledData = {
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        order_number: order.order_number,
        order_date: new Date(order.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        cancellation_date: new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        cancellation_reason: reason || 'Order cancelled by admin',
        refund_amount: `£${refundAmount.toFixed(2)}`,
        refund_method: 'Original payment method',
        refund_processing_time: '3–5 business days',
        subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
        shipping_cost: `£${shippingCost.toFixed(2)}`,
        total_amount: `£${refundAmount.toFixed(2)}`,
        order_items: (order.items || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: `£${parseFloat(item.price).toFixed(2)}`,
        })),
      };

      await sendOrderCancelledEmail(cancelledData);
      console.log(`Cancellation email sent to ${order.customer_email}`);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled and refund processed successfully',
      data: {
        order_number: orderNumber,
        refund_amount: refundAmount,
        refund_currency: refundCurrency,
        refund_processing_time: '3-5 business days',
        cancelled_at: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error.message
    });
  }
}
