import { useMemo } from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
} from '@stripe/stripe-js';
import { toast } from 'sonner';
import { getStripe, stripeElementsAppearance } from '@/lib/stripe';
import type { CartItem } from '@/context/CartContext';

interface PrefilledCustomer {
  name: string;
  email: string;
  phone?: string;
}

interface PrefilledAddress {
  address: string;
  postcode: string;
}

interface StripeExpressCheckoutProps {
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoCode?: string;
  total: number;
  /** Display label for the chosen shipping option in the wallet sheet. */
  deliveryLabel?: string;
  /** Pre-fill values when the user has already entered them (checkout page). */
  customer?: PrefilledCustomer;
  shippingAddress?: PrefilledAddress;
  /** Called after a successful confirm before the browser redirects. */
  onSuccess?: (orderId: string) => void;
  className?: string;
}

function ExpressCheckoutInner({
  cartItems,
  subtotal,
  deliveryFee,
  discount,
  promoCode,
  total,
  deliveryLabel = 'Standard delivery',
  customer,
  shippingAddress,
  onSuccess,
}: StripeExpressCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();

  const hasPrefilledAddress = Boolean(
    shippingAddress?.address && shippingAddress?.postcode
  );

  const options: StripeExpressCheckoutElementOptions = useMemo(
    () => ({
      emailRequired: !customer?.email,
      phoneNumberRequired: !customer?.phone,
      shippingAddressRequired: !hasPrefilledAddress,
      allowedShippingCountries: ['GB'],
      shippingRates: hasPrefilledAddress
        ? undefined
        : [
            {
              id: 'photify-delivery',
              displayName: deliveryLabel,
              amount: Math.round(deliveryFee * 100),
            },
          ],
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
    [
      customer?.email,
      customer?.phone,
      hasPrefilledAddress,
      deliveryLabel,
      deliveryFee,
    ]
  );

  const handleConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    if (!stripe || !elements) {
      toast.error('Payment is not ready yet. Please try again in a moment.');
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message || 'Could not validate payment details.');
      return;
    }

    // Resolve customer + address from prefilled values, falling back to the
    // wallet sheet's contributions. Apple Pay returns names in
    // billingDetails / shippingAddress.recipient; Google Pay returns email
    // via billingDetails.email.
    const walletName =
      event.billingDetails?.name || event.shippingAddress?.name || '';
    const walletEmail = event.billingDetails?.email || '';
    const walletPhone = event.billingDetails?.phone || '';

    const resolvedName = customer?.name || walletName;
    const resolvedEmail = customer?.email || walletEmail;
    const resolvedPhone = customer?.phone || walletPhone || '';

    let resolvedAddress = shippingAddress?.address || '';
    let resolvedPostcode = shippingAddress?.postcode || '';

    if (!resolvedAddress && event.shippingAddress?.address) {
      const addr = event.shippingAddress.address;
      resolvedAddress = [
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postal_code,
      ]
        .filter(Boolean)
        .join(', ');
      resolvedPostcode = addr.postal_code || '';
    }

    if (!resolvedName || !resolvedEmail) {
      toast.error('Your wallet did not return enough info to complete checkout.');
      return;
    }

    if (!resolvedAddress || !resolvedPostcode) {
      toast.error('A delivery address is required.');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems,
            customerInfo: {
              name: resolvedName,
              email: resolvedEmail,
              phone: resolvedPhone,
            },
            shippingAddress: {
              address: resolvedAddress,
              postcode: resolvedPostcode,
            },
            subtotal,
            deliveryFee,
            discount,
            promoCode: promoCode || undefined,
            total,
            source: 'express_checkout',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      sessionStorage.setItem('pendingOrderId', data.orderId);
      onSuccess?.(data.orderId);

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation?order_id=${data.orderId}`,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Express checkout error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to process express checkout'
      );
    }
  };

  return (
    <ExpressCheckoutElement
      options={options}
      onConfirm={handleConfirm}
      onLoadError={({ error }) => {
        console.warn('ExpressCheckoutElement load error:', error?.message);
      }}
    />
  );
}

/**
 * Renders Apple Pay / Google Pay / Link buttons (whichever the user's device
 * supports). On tap, the wallet sheet collects any missing data, then we
 * create a PaymentIntent + order and confirm the payment inline.
 *
 * Safely no-ops when Stripe isn't configured (publishable key missing) or
 * when the user's environment supports none of the wallets.
 */
export function StripeExpressCheckout(props: StripeExpressCheckoutProps) {
  const amountInPence = Math.round(props.total * 100);

  // Stripe requires amount >= 50p (their global minimum). Skip the element
  // entirely below that — keeps free/dev orders from throwing.
  if (amountInPence < 50) {
    return null;
  }

  return (
    <div className={props.className}>
      <Elements
        stripe={getStripe()}
        options={{
          mode: 'payment',
          amount: amountInPence,
          currency: 'gbp',
          appearance: stripeElementsAppearance,
        }}
      >
        <ExpressCheckoutInner {...props} />
      </Elements>
    </div>
  );
}
