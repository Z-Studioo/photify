import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Lazily-loads the Stripe.js client. Single shared promise so we don't
 * download stripe.js more than once even if multiple components call it.
 *
 * Reads the publishable key from `VITE_STRIPE_PUBLISHABLE_KEY`.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
      | string
      | undefined;
    if (!key) {
      console.warn(
        '[stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set; Stripe Elements will not work.'
      );
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

/**
 * Shared Elements appearance so cart, checkout and any future flow look
 * cohesive with the rest of the Photify UI.
 */
export const stripeElementsAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#f63a9e',
    colorBackground: '#ffffff',
    colorText: '#111827',
    colorDanger: '#ef4444',
    fontFamily: 'Mona Sans, system-ui, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '2px solid #e5e7eb',
      boxShadow: 'none',
      padding: '12px 14px',
    },
    '.Input:focus': {
      border: '2px solid #f63a9e',
      boxShadow: '0 0 0 4px rgba(246, 58, 158, 0.1)',
    },
    '.Label': {
      fontWeight: '600',
      fontSize: '14px',
    },
  },
};
