import { supabase } from './supabase';

export interface PromoChargeResult {
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  valid: boolean;
  errorMessage?: string;
}

/**
 * Recompute subtotal, promo discount, and total from cart line items.
 * Server is the charge authority — ignores client-sent discount/total.
 */
export async function computePromoCharge(params: {
  cartItems: Array<{ price: number; quantity: number }>;
  deliveryFee: number;
  promoCode?: string | null | undefined;
}): Promise<PromoChargeResult> {
  const subtotal = params.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = Math.max(0, Number(params.deliveryFee) || 0);
  const code = (params.promoCode || '').trim().toUpperCase();

  if (!code || subtotal <= 0) {
    return {
      subtotal,
      discount: 0,
      total: Math.max(0, subtotal + deliveryFee),
      promoCode: null,
      valid: true,
    };
  }

  const { data, error } = await supabase.rpc('is_promotion_valid', {
    promotion_code: code,
    order_total: subtotal,
  });

  if (error) {
    console.error('is_promotion_valid error:', error);
    return {
      subtotal,
      discount: 0,
      total: Math.max(0, subtotal + deliveryFee),
      promoCode: null,
      valid: false,
      errorMessage: 'Failed to validate promotion',
    };
  }

  const row = data?.[0];
  if (row?.valid) {
    const discount = Math.max(0, Number(row.discount_amount) || 0);
    const total = Math.max(0, subtotal + deliveryFee - discount);
    return {
      subtotal,
      discount,
      total,
      promoCode: code,
      valid: true,
    };
  }

  return {
    subtotal,
    discount: 0,
    total: Math.max(0, subtotal + deliveryFee),
    promoCode: null,
    valid: false,
    errorMessage: row?.error_message || 'Invalid or expired promotion code',
  };
}
