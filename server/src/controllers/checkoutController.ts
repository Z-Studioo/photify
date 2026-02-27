import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';

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
  discount?: number;
  promoCode?: string;
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
      discount = 0,
      promoCode,
      total,
    } = req.body;

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
    const { data: orderNumberData, error: orderNumberError } =
      await supabase.rpc('generate_order_number');

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
      res
        .status(500)
        .json({ error: `Failed to create order: ${orderError.message}` });
      return;
    }

    // Apply promo discount proportionally across item prices so Stripe totals match
    const itemsSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountRatio =
      discount > 0 && itemsSubtotal > 0
        ? Math.min(discount / itemsSubtotal, 1)
        : 0;

    // Create line items for Stripe
    const lineItems = cartItems.map(item => {
      const productData: any = {
        name: item.name,
      };

      // Build description: include size and promo info
      const descParts: string[] = [];
      if (item.size && item.size.trim()) descParts.push(item.size);
      if (promoCode && discountRatio > 0) descParts.push(`Promo: ${promoCode}`);
      if (descParts.length > 0) productData.description = descParts.join(' · ');

      // Only add images if they are publicly accessible https:// URLs
      // (blob: and data: URLs are not valid for Stripe)
      if (item.image && item.image.startsWith('https://')) {
        productData.images = [item.image];
      }

      // Discount applied proportionally; ensure minimum 1 cent per item
      const discountedPrice = item.price * (1 - discountRatio);

      return {
        price_data: {
          currency: 'usd',
          product_data: productData,
          unit_amount: Math.max(1, Math.round(discountedPrice * 100)),
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
      success_url: `${config.CLIENT_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${config.CLIENT_URL}/checkout?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
      invoice_creation: {
        enabled: true,
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
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}
