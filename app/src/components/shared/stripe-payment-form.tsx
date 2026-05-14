import { useMemo, useState } from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStripe, stripeElementsAppearance } from '@/lib/stripe';
import type { CartItem } from '@/context/CartContext';

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface ShippingAddressInfo {
  address: string;
  postcode: string;
}

interface StripePaymentFormProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoCode?: string;
  total: number;
  customer: CustomerInfo;
  shippingAddress: ShippingAddressInfo;
  deliveryLabel?: string;
  onSuccess?: (orderId: string) => void;
}

async function createOrderAndIntent(
  body: Record<string, unknown>
): Promise<{ clientSecret: string; orderId: string }> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/payment-intent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create payment intent');
  }
  return { clientSecret: data.clientSecret, orderId: data.orderId };
}

function PaymentFormInner({
  cartItems,
  subtotal,
  deliveryFee,
  discount,
  promoCode,
  total,
  customer,
  shippingAddress,
  deliveryLabel = 'Standard delivery',
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const expressOptions: StripeExpressCheckoutElementOptions = useMemo(
    () => ({
      // We already have these from the form; don't re-prompt in the wallet.
      emailRequired: false,
      phoneNumberRequired: false,
      shippingAddressRequired: false,
      buttonHeight: 48,
      buttonTheme: {
        applePay: 'black',
        googlePay: 'black',
      },
      paymentMethods: {
        applePay: 'always',
        googlePay: 'always',
        link: 'auto',
        paypal: 'never',
        amazonPay: 'never',
      },
    }),
    []
  );

  const paymentElementOptions: StripePaymentElementOptions = useMemo(
    () => ({
      layout: { type: 'tabs', defaultCollapsed: false },
      // Prefill what we already collected on Step 1 so the user never
      // re-types it. For cards, Stripe hides the billing address anyway.
      // For payment methods that NEED a structured address (Klarna, Revolut
      // Pay, BNPL, etc.), Stripe will show the prefilled fields so the user
      // can confirm / correct them in one tap.
      defaultValues: {
        billingDetails: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          address: {
            line1: shippingAddress.address,
            postal_code: shippingAddress.postcode,
            country: 'GB',
          },
        },
      },
      // We only claim "never" for the fields where we always have a
      // confident value to supply in confirmParams (name/email/phone).
      // Address fields are left to Stripe so it can collect any pieces a
      // given payment method requires (city / state / etc.) without
      // erroring out.
      fields: {
        billingDetails: {
          name: 'never',
          email: 'never',
          phone: 'never',
        },
      },
      wallets: {
        applePay: 'never',
        googlePay: 'never',
      },
    }),
    [
      customer.name,
      customer.email,
      customer.phone,
      shippingAddress.address,
      shippingAddress.postcode,
    ]
  );

  const buildIntentBody = (source: 'express_checkout' | 'payment_element') => ({
    cartItems,
    customerInfo: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
    },
    shippingAddress: {
      address: shippingAddress.address,
      postcode: shippingAddress.postcode,
    },
    subtotal,
    deliveryFee,
    discount,
    promoCode: promoCode || undefined,
    total,
    source,
  });

  const confirmWithStripe = async (clientSecret: string, orderId: string) => {
    if (!stripe || !elements) return;

    // Only include the billing_details fields we marked as 'never' on the
    // Payment Element — name/email/phone. Address is collected by the
    // element (when needed) so we must NOT also force it via
    // payment_method_data, otherwise Stripe rejects mismatched empties.
    const billingDetails: {
      name: string;
      email: string;
      phone?: string;
    } = {
      name: customer.name,
      email: customer.email,
    };
    if (customer.phone) {
      billingDetails.phone = customer.phone;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation?order_id=${orderId}`,
        // Shipping is set here (with publishable key) because the
        // PaymentIntent was created without it on the server — letting
        // Klarna / BNPL providers update shipping during confirm without
        // hitting Stripe's cross-key-write block.
        shipping: {
          name: customer.name,
          ...(customer.phone ? { phone: customer.phone } : {}),
          address: {
            line1: shippingAddress.address,
            postal_code: shippingAddress.postcode,
            country: 'GB',
          },
        },
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
    });

    if (error) {
      const message = error.message || 'Payment failed. Please try again.';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleExpressConfirm = async (
    _event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    if (!stripe || !elements) return;
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      const message =
        submitError.message || 'Could not validate payment details.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      const { clientSecret, orderId } = await createOrderAndIntent(
        buildIntentBody('express_checkout')
      );
      sessionStorage.setItem('pendingOrderId', orderId);
      onSuccess?.(orderId);
      await confirmWithStripe(clientSecret, orderId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Express checkout failed';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleCardPay = async () => {
    if (!stripe || !elements || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      const message =
        submitError.message || 'Please check your payment details.';
      setErrorMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    try {
      const { clientSecret, orderId } = await createOrderAndIntent(
        buildIntentBody('payment_element')
      );
      sessionStorage.setItem('pendingOrderId', orderId);
      onSuccess?.(orderId);
      await confirmWithStripe(clientSecret, orderId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to process payment';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note: deliveryLabel intentionally consumed by the Elements options outside;
  // referenced here so TS doesn't flag it as unused when we later wire it in.
  void deliveryLabel;

  return (
    <div className='space-y-5'>
      {/* Express buttons (Apple Pay / Google Pay / Link) */}
      <div>
        <ExpressCheckoutElement
          options={expressOptions}
          onConfirm={handleExpressConfirm}
          onLoadError={({ error }) => {
            console.warn('ExpressCheckoutElement load error:', error?.message);
          }}
        />
      </div>

      {/* "Or pay with card" divider */}
      <div className='flex items-center gap-3'>
        <div className='flex-1 h-px bg-gray-200' />
        <span
          className='text-xs text-gray-400 uppercase tracking-wider'
          style={{ fontWeight: '600' }}
        >
          or pay with card
        </span>
        <div className='flex-1 h-px bg-gray-200' />
      </div>

      {/* Card / inline payment fields */}
      <div className='p-1'>
        <PaymentElement options={paymentElementOptions} />
      </div>

      {errorMessage && (
        <div className='p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm'>
          {errorMessage}
        </div>
      )}

      <Button
        type='button'
        onClick={handleCardPay}
        disabled={!stripe || !elements || isSubmitting}
        className='w-full bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl shadow-md disabled:opacity-70 transition-colors'
        style={{ fontWeight: '700', fontSize: '15px', height: '54px' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
            Processing...
          </>
        ) : (
          <>
            <Lock className='w-4 h-4 mr-2' />
            Pay £{total.toFixed(2)}
          </>
        )}
      </Button>

      <p className='text-center text-xs text-gray-500'>
        Payments are encrypted &amp; processed by Stripe.
      </p>
    </div>
  );
}

/**
 * Full inline payment form: Express Checkout (Apple/Google Pay/Link) on top,
 * Stripe Payment Element below, with a single "Pay £X" submit button. All
 * within a single `<Elements>` provider so both options share the same
 * deferred PaymentIntent and amount.
 */
export function StripePaymentForm(props: StripePaymentFormProps) {
  const amountInPence = Math.round(props.total * 100);

  if (amountInPence < 50) {
    return (
      <div className='p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-yellow-800 text-sm'>
        Order total must be at least £0.50 to pay online.
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        mode: 'payment',
        amount: amountInPence,
        currency: 'gbp',
        appearance: stripeElementsAppearance,
      }}
    >
      <PaymentFormInner {...props} />
    </Elements>
  );
}
