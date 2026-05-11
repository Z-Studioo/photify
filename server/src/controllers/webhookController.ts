import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail, getDeliveryInfo } from '@/lib/sendgrid';
import Stripe from 'stripe';

/**
 * Helper function to upert customer record
 * Creates new customer or updates existing customer's order stats
 */
async function upsertCustomer(order: any): Promise<void> {
  try {
    // Check if customer exists by email
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('id, total_orders, total_spent')
      .eq('email', order.customer_email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" - expected for new customers
      console.error('Error fetching customer:', fetchError);
      return;
    }

    const orderTotal = parseFloat(order.total) || 0;

    if (existing) {
      // Update existing customer
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          total_orders: (existing.total_orders || 0) + 1,
          total_spent: (existing.total_spent || 0) + orderTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating customer:', updateError);
      } else {
        console.log('Customer updated:', existing.id);
      }
    } else {
      // Insert new customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          email: order.customer_email,
          name: order.customer_name,
          phone: order.customer_phone || null,
          total_orders: 1,
          total_spent: orderTotal,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating customer:', insertError);
      } else {
        console.log('New customer created:', newCustomer.id);
      }
    }
  } catch (error) {
    console.error('Error in upsertCustomer:', error);
    // Don't throw - customer upsert failure shouldn't block webhook processing
  }
}

/**
 * Helper function to send order confirmation email
 */
async function sendConfirmationEmailForOrder(order: any): Promise<void> {
  try {
    // Get delivery info based on shipping cost
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const deliveryInfo = getDeliveryInfo(shippingCost);

    // Calculate estimated delivery date based on delivery type
    const estimatedDelivery = new Date();
    const daysToAdd = deliveryInfo.delivery_type === 'Express Shipping' ? 3 : 7;
    estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToAdd);

    // Format shipping address
    const shippingAddress = typeof order.shipping_address === 'string'
      ? order.shipping_address
      : order.shipping_address?.address || 'N/A';

    // Prepare email data
    const emailData = {
      order_number: order.order_number,
      order_date: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      delivery_type: deliveryInfo.delivery_type,
      estimated_delivery: estimatedDelivery.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      subtotal: `£${parseFloat(order.subtotal).toFixed(2)}`,
      shipping_cost: `£${parseFloat(order.shipping_cost || 0).toFixed(2)}`,
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
      },
    };

    // Send email to customer
    await sendOrderConfirmationEmail(emailData);

    // Send email to admin
    await sendAdminNewOrderEmail(emailData);
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't throw - email failure shouldn't block webhook processing
  }
}


/**
 * POST /api/webhook
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).json({ error: 'No signature' });
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update order status to paid
        const { data: order, error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating order:', error);
        } else if (order) {
          console.log('Payment successful for session:', session.id);

          // Audit row so the admin UI can show "Stripe confirmed payment"
          // without conflating it with the (no-op) admin button.
          await supabase.from('order_status_history').insert({
            order_number: order.order_number,
            previous_status: 'pending',
            new_status: 'processing',
            source: 'stripe',
            email_sent: true, // Order confirmation email is sent below.
            metadata: {
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
            },
          });

          // Upsert customer record
          await upsertCustomer(order);

          // Increment promotion usage count if a promo code was applied
          if (order.promo_code) {
            const { error: promoError } = await supabase.rpc(
              'apply_promotion_to_order',
              {
                promotion_code: order.promo_code,
                order_uuid: order.id,
              }
            );
            if (promoError) {
              console.error('Failed to increment promotion usage:', promoError);
            }
          }

          // Send order confirmation email
          await sendConfirmationEmailForOrder(order);
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update order status to failed
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating failed payment:', error);
        }

        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      case 'invoice_payment.paid': {
        const invoice_payment = event.data.object as Stripe.InvoicePayment;
        const invoice = await stripe.invoices.retrieve(
          invoice_payment.invoice as string
        );

        console.log("Invoice url", invoice.hosted_invoice_url);

        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            paid_at: new Date().toISOString(),
            hosted_invoice_url: invoice.hosted_invoice_url,
          })
          .eq(
            'stripe_payment_intent_id',
            invoice_payment.payment.payment_intent as string
          );

        if (error) {
          console.error('Error updating order with invoice:', error);
        }
        
        // Note: Email is sent via checkout.session.completed event only
        // to avoid duplicate emails

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
