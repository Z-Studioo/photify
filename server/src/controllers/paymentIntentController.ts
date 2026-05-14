import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

interface CartItem {
  name: string;
  size?: string;
  image?: string;
  images?: string[];
  price: number;
  quantity: number;
  customization?: {
    edgeType?: string;
    cornerStyle?: string;
    imageQuality?: number;
    shape?: string;
  };
}

interface PaymentIntentRequestBody {
  cartItems: CartItem[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    address: string;
    postcode: string;
  };
  videoPermission?: boolean;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  promoCode?: string;
  total: number;
  // Optional hint so the webhook handler can pick the right post-processing path.
  source?: 'express_checkout' | 'payment_element' | 'checkout_session';
}

/**
 * POST /api/payment-intent
 * Create a pending order and a Stripe PaymentIntent for embedded payment
 * flows (Payment Element, Express Checkout — Apple Pay / Google Pay / Link).
 *
 * Returns the clientSecret so the frontend can confirm the payment inline
 * with `stripe.confirmPayment()`. The order is created in `pending` state
 * and marked paid once the `payment_intent.succeeded` webhook fires.
 */
export async function createPaymentIntent(
  req: Request<{}, {}, PaymentIntentRequestBody>,
  res: Response
): Promise<void> {
  try {
    const {
      cartItems,
      customerInfo,
      shippingAddress,
      videoPermission,
      subtotal,
      deliveryFee,
      promoCode,
      total,
      source,
    } = req.body;

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    if (!customerInfo?.name || !customerInfo?.email) {
      res.status(400).json({ error: 'Customer information is required' });
      return;
    }

    if (!shippingAddress?.address || !shippingAddress?.postcode) {
      res.status(400).json({ error: 'Shipping address is required' });
      return;
    }

    if (typeof total !== 'number' || total <= 0) {
      res.status(400).json({ error: 'Invalid order total' });
      return;
    }

    const { data: orderNumberData, error: orderNumberError } =
      await supabase.rpc('generate_order_number');

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      res.status(500).json({ error: 'Failed to generate order number' });
      return;
    }

    const orderNumber = orderNumberData as string;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || '',
        shipping_address: {
          address: shippingAddress.address,
          postcode: shippingAddress.postcode,
        },
        shipping_postcode: shippingAddress.postcode,
        items: cartItems,
        subtotal,
        shipping_cost: deliveryFee,
        total,
        video_permission: videoPermission || false,
        estimated_delivery: estimatedDelivery.toISOString().split('T')[0],
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      res
        .status(500)
        .json({ error: `Failed to create order: ${orderError.message}` });
      return;
    }

    // Stripe takes amount in the smallest currency unit (pence for GBP).
    const amountInPence = Math.round(total * 100);

    // Intentionally NOT setting `shipping` here. Some payment methods
    // (Klarna, certain BNPL providers, wallets) need to write to the
    // PaymentIntent's shipping field during confirm — and Stripe blocks
    // cross-key writes ("set with a secret key … cannot be changed with a
    // publishable key"). We let the frontend supply shipping through
    // `confirmParams.shipping` instead. The order itself still stores the
    // address in Supabase for fulfilment.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: customerInfo.email,
      description: `Photify order ${orderNumber}`,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        customer_email: customerInfo.email,
        promo_code: promoCode || '',
        source: source || 'payment_element',
      },
    });

    await supabase
      .from('orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', order.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * PATCH /api/payment-intent/:id
 * Update an existing PaymentIntent's amount/shipping (e.g. after the wallet
 * sheet returns a different shipping address). Use sparingly — most flows
 * collect the address before calling /api/payment-intent in the first place.
 */
export async function updatePaymentIntent(
  req: Request<{ id: string }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, shipping } = req.body as {
      amount?: number;
      shipping?: {
        name: string;
        phone?: string;
        address: {
          line1: string;
          line2?: string;
          city?: string;
          postal_code: string;
          country?: string;
        };
      };
    };

    const update: Record<string, unknown> = {};
    if (typeof amount === 'number') {
      update.amount = Math.round(amount * 100);
    }
    if (shipping) {
      update.shipping = shipping;
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No update fields supplied' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.update(id, update);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Update PaymentIntent error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}
