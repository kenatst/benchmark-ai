import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - this is a PUBLIC key (not secret) so it's safe to include in client code
// Uses environment variable if available, falls back to test mode key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  || 'pk_test_51Sw0y9BlwVXDER87pHQRQvL3VrG2MH9CLFTqfHN7z7qKLpvWHRIcGQvxm7rAm8bLNJzLxQbZpA7CLfxPHqZjlGwc00cwlZHvHK';

export const stripePromise = loadStripe(stripePublishableKey);
