import { loadStripe } from '@stripe/stripe-js';

// Use the Stripe publishable key from environment
// This is a publishable key, safe to use in frontend code
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Sw0y9BlwVXDER87pHQRQvL3VrG2MH9CLFTqfHN7z7qKLpvWHRIcGQvxm7rAm8bLNJzLxQbZpA7CLfxPHqZjlGwc00cwlZHvHK';

export const stripePromise = loadStripe(stripePublishableKey);
