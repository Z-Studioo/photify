import { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { sendOrderCancelledEmail } from '@/lib/sendgrid';
import {
  parcel2go,
  isParcel2GoConfigured,
  Parcel2GoApiError,
} from '@/lib/parcel2go';

/**
 * POST /api/orders/:orderNumber/cancel
 *
 * Cancels an order end-to-end:
 *   1. Best-effort cancel of the Parcel2Go shipment if one is booked. We
 *      log the outcome so admins know whether they need to manually void
 *      the label in Parcel2Go's dashboard.
 *   2. Refund (or cancel the uncaptured payment intent) via Stripe.
 *   3. Flip the order to `cancelled` + `payment_status='refunded'` and
 *      append an audit row.
 *   4. Send the cancellation email to the customer.
 *
 * Cancelling a `delivered` or already `cancelled` order is rejected — a
 * delivered order should be handled via the returns flow, not this
 * endpoint, since the customer already has the goods.
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

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({ error: 'Order is already cancelled' });
      return;
    }
    if (order.status === 'delivered') {
      res.status(400).json({
        error:
          'Delivered orders cannot be cancelled — issue a refund / return instead.',
      });
      return;
    }

    if (order.payment_status !== 'paid') {
      res.status(400).json({
        error: 'Order cannot be cancelled - payment not completed',
      });
      return;
    }

    if (!order.stripe_payment_intent_id) {
      res.status(400).json({
        error: 'Order cannot be cancelled - no payment intent found',
      });
      return;
    }

    // ---- 1. Best-effort Parcel2Go void --------------------------------
    let parcel2goCancelled = false;
    let parcel2goWarning: string | null = null;
    if (order.parcel2go_order_id && isParcel2GoConfigured()) {
      try {
        await parcel2go.cancelOrder(order.parcel2go_order_id);
        parcel2goCancelled = true;
        console.log(
          `[cancel-order] Parcel2Go shipment ${order.parcel2go_order_id} cancelled for ${orderNumber}`
        );
      } catch (err) {
        // Don't block the refund — surface a warning instead so the admin
        // knows to void the label manually in the Parcel2Go dashboard.
        if (err instanceof Parcel2GoApiError) {
          parcel2goWarning = `Parcel2Go responded ${err.status}: ${err.message}. Cancel the label manually in the Parcel2Go dashboard if needed.`;
        } else {
          parcel2goWarning =
            err instanceof Error
              ? `Parcel2Go cancellation failed: ${err.message}`
              : 'Parcel2Go cancellation failed for an unknown reason.';
        }
        console.warn(
          `[cancel-order] Parcel2Go void failed for ${orderNumber}`,
          err
        );
      }
    }

    // ---- 2. Stripe refund / cancel ------------------------------------
    let refundAmount = parseFloat(order.total);
    let refundCurrency = 'GBP';

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );

      refundAmount = paymentIntent.amount / 100;
      refundCurrency = paymentIntent.currency.toUpperCase();

      if (
        !['succeeded', 'requires_capture', 'requires_payment_method'].includes(
          paymentIntent.status
        )
      ) {
        res.status(400).json({
          error: `Cannot cancel order with payment status: ${paymentIntent.status}`,
        });
        return;
      }

      if (paymentIntent.status === 'requires_capture') {
        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
        console.log(
          `Cancelled uncaptured payment intent: ${order.stripe_payment_intent_id}`
        );
      } else if (paymentIntent.status === 'succeeded') {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: paymentIntent.amount,
          reason: 'requested_by_customer',
          metadata: {
            order_number: orderNumber,
            cancellation_reason: reason || 'Order cancelled by admin',
          },
        });
        console.log(`Refund issued: ${refund.id} for order: ${orderNumber}`);
      }
    } catch (stripeError: any) {
      console.error('Stripe error during cancellation:', stripeError);
      res.status(500).json({
        error: 'Failed to process cancellation with Stripe',
        details: stripeError.message,
      });
      return;
    }

    // ---- 3. Flip status (optimistic lock against the current value) ---
    const previousStatus = order.status;
    const cancelledAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'refunded',
        cancelled_at: cancelledAt,
        remarks: reason || order.remarks || 'Order cancelled by admin',
      })
      .eq('order_number', orderNumber)
      .eq('status', previousStatus)
      .select('order_number')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      res.status(500).json({
        error: 'Failed to update order status',
        details: updateError.message,
      });
      return;
    }
    if (!updated) {
      res.status(409).json({
        error: 'Order status changed in another session — refresh and retry.',
      });
      return;
    }

    // ---- 4. Audit row --------------------------------------------------
    const actor =
      (req as any).user?.email || (req as any).user?.id || null;
    await supabase.from('order_status_history').insert({
      order_number: orderNumber,
      previous_status: previousStatus,
      new_status: 'cancelled',
      source: 'admin',
      actor,
      reason: reason || 'Order cancelled by admin',
      email_sent: false, // will flip after we send the email
      metadata: {
        refund_amount: refundAmount,
        refund_currency: refundCurrency,
        parcel2go_order_id: order.parcel2go_order_id || null,
        parcel2go_cancelled: parcel2goCancelled,
        parcel2go_warning: parcel2goWarning,
      },
    });

    // ---- 5. Customer email --------------------------------------------
    let emailSent = false;
    try {
      const shippingCost = parseFloat(order.shipping_cost || 0);
      await sendOrderCancelledEmail({
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
      });
      emailSent = true;
      console.log(`Cancellation email sent to ${order.customer_email}`);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    if (emailSent) {
      // Best-effort: locate the audit row we just inserted (most recent
      // admin-sourced 'cancelled' transition for this order) and flip its
      // email_sent flag.
      const { data: latestAudit } = await supabase
        .from('order_status_history')
        .select('id')
        .eq('order_number', orderNumber)
        .eq('new_status', 'cancelled')
        .eq('source', 'admin')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestAudit?.id) {
        await supabase
          .from('order_status_history')
          .update({ email_sent: true })
          .eq('id', latestAudit.id);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled and refund processed successfully',
      data: {
        order_number: orderNumber,
        refund_amount: refundAmount,
        refund_currency: refundCurrency,
        refund_processing_time: '3-5 business days',
        cancelled_at: cancelledAt,
        parcel2go_cancelled: parcel2goCancelled,
        parcel2go_warning: parcel2goWarning,
        email_sent: emailSent,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error.message,
    });
  }
}
