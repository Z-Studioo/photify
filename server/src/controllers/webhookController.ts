import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

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
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);

        if (error) {
          console.error('Error updating order:', error);
        }

        console.log('Payment successful for session:', session.id);
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

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            paid_at: new Date().toISOString(),
            invoice_hosted_url: invoice.hosted_invoice_url,
          })
          .eq(
            'stripe_payment_intent_id',
            invoice_payment.payment.payment_intent as string
          );
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
