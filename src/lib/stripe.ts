import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - use environment variable with hardcoded fallback for production
// IMPORTANT: This is a PUBLISHABLE key (safe to include in client code, starts with pk_)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Sw8c5BlwVXDER87XJnPwqqWhKG63cJQ5YVXF4cGNcLAhGqNsNWqJqGleFLcZFuSLFj4GBMTmVAn56DvV8zk7bJ900ypKy1AhN';

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe payments will not work.');
}

export const stripePromise = loadStripe(stripePublishableKey);
