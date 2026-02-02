import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate that Stripe key is configured
if (!stripePublishableKey) {
  console.error(
    '❌ CRITICAL: VITE_STRIPE_PUBLISHABLE_KEY environment variable is missing. ' +
    'Stripe payments will not work. See .env.example for configuration.'
  );
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);
