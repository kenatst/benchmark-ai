import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - requires VITE_STRIPE_PUBLISHABLE_KEY environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe payments will not work.');
}

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);
