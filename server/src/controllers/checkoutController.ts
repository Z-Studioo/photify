import { Request, Response } from 'express';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';
import { resolveAffiliateByCode } from '@/lib/affiliate';
import { computePromoCharge } from '@/lib/promo';
import { getEstimatedDeliveryDate } from '@/lib/sendgrid';

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
  // Only an explicitly typed-in `manual` code hard-fails when invalid; auto/
  // affiliate promos are dropped silently so a stale promo never blocks a sale.
  promoSource?: 'manual' | 'affiliate' | 'auto_apply';
  total: number;
  affiliateCode?: string;
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
      deliveryFee,
      promoCode,
      promoSource,
      affiliateCode,
    } = req.body;

    // Attribute the order to an affiliate from the explicit referral code
    // (cookie set via /r/:code) when present, otherwise fall back to the
    // applied promo code — affiliates often share just their code, and a
    // referral code doubles as a matching promotion code. resolveAffiliateByCode
    // safely returns null for non-affiliate promo codes.
    const affiliate = await resolveAffiliateByCode(affiliateCode || promoCode);

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

    const charge = await computePromoCharge({
      cartItems,
      deliveryFee,
      promoCode,
    });

    // Only block when a user explicitly typed an invalid code. Auto/affiliate
    // promos are dropped silently (charge falls back to full price).
    if (!charge.valid && promoCode && promoSource === 'manual') {
      res
        .status(400)
        .json({ error: charge.errorMessage || 'Invalid promotion' });
      return;
    }

    if (!charge.valid && promoCode) {
      console.warn(
        `[checkout] dropping invalid ${promoSource || 'unknown'} promo "${promoCode}": ${charge.errorMessage}`
      );
    }

    const { subtotal, discount, total, promoCode: validatedPromo } = charge;

    // Express (£6.99) delivers in 5 days, standard in 10. This is the single
    // source of truth for delivery dates shown across the app and emails.
    const estimatedDelivery = getEstimatedDeliveryDate(deliveryFee);

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
        promo_code: validatedPromo,
        video_permission: videoPermission || false,
        estimated_delivery: estimatedDelivery.toISOString().split('T')[0],
        payment_status: 'pending',
        status: 'pending',
        affiliate_id: affiliate?.id || null,
        affiliate_code: affiliate?.code || null,
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
      // Show only the base product name on Stripe (strip trailing
      // ratio/size segments separated by " — " / " - " / " – ").
      // Keeps in-word hyphens like "Multi-Canvas" intact.
      const displayName =
        item.name?.trim().split(/\s+[—–-]\s+/)[0]?.trim() || item.name;

      const productData: any = {
        name: displayName,
      };

      // Build description: include size and promo info
      const descParts: string[] = [];
      if (item.size && item.size.trim()) descParts.push(item.size);
      if (validatedPromo && discountRatio > 0)
        descParts.push(`Promo: ${validatedPromo}`);
      if (descParts.length > 0) productData.description = descParts.join(' · ');

      // Intentionally do NOT pass any images to Stripe so the hosted
      // checkout matches the image-free cart/checkout summary.

      // Discount applied proportionally; ensure minimum 1 cent per item
      const discountedPrice = item.price * (1 - discountRatio);

      return {
        price_data: {
          currency: 'gbp',
          product_data: productData,
          unit_amount: Math.max(1, Math.round(discountedPrice * 100)),
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee as a line item
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: 'Delivery Fee',
          description: 'Standard shipping',
        },
        unit_amount: Math.round(deliveryFee * 100), // Convert to pence
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
        affiliate_id: affiliate?.id || '',
        affiliate_code: affiliate?.code || '',
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
