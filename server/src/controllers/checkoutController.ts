import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

interface CartItem {
  name: string;
  size?: string;
  image?: string;
  price: number;
  quantity: number;
}

interface CheckoutRequestBody {
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
  total: number;
}

/**
 * POST /api/checkout
 * Create Stripe checkout session and order
 */
export async function createCheckoutSession(
  req: Request<{}, {}, CheckoutRequestBody>,
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
      total,
    } = req.body;

    console.log('Checkout request received:', { body: req.body });

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      res.status(400).json({ error: 'Customer information is required' });
      return;
    }

    if (!shippingAddress?.address || !shippingAddress?.postcode) {
      res.status(400).json({ error: 'Shipping address is required' });
      return;
    }

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      res.status(500).json({ error: 'Failed to generate order number' });
      return;
    }

    const orderNumber = orderNumberData as string;

    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create order in database with pending status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
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
      console.error('Order data attempted:', {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        shipping_address: {
          address: shippingAddress.address,
          postcode: shippingAddress.postcode,
        },
        items: cartItems,
      });
      res.status(500).json({ error: `Failed to create order: ${orderError.message}` });
      return;
    }

    // Create line items for Stripe
    const lineItems = cartItems.map((item) => {
      const productData: any = {
        name: item.name,
      };

      // Only add description if it exists and is not empty
      if (item.size && item.size.trim()) {
        productData.description = item.size;
      }

      // Only add images if they exist
      if (item.image) {
        productData.images = [item.image];
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: productData,
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee as a line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Delivery Fee',
          description: 'Standard shipping',
        },
        unit_amount: Math.round(deliveryFee * 100), // Convert to cents
      },
      quantity: 1,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
      })
      .eq('id', order.id);

    res.status(200).json({
      sessionId: session.id,
      orderId: order.id,
      orderNumber,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}
