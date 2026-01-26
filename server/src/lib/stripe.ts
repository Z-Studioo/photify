import Stripe from 'stripe';

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // apiVersion: '2025-12-15.clover',
  typescript: true,
});

export default stripe;
