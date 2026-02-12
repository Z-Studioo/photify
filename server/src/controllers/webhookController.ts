import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/sendgrid';
import Stripe from 'stripe';

/**
 * Helper function to send order confirmation email
 */
async function sendConfirmationEmailForOrder(order: any): Promise<void> {
  try {
    // Calculate estimated delivery (7 days from now for standard shipping)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
    
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
      delivery_type: order.delivery_method || 'Standard Shipping',
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

    await sendOrderConfirmationEmail(emailData);
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
