import Stripe from 'stripe';

let client: Stripe | null = null;

/** Server-only. Instantiated lazily so a missing env var only breaks billing routes, not the whole build. */
export function getStripeClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' });
  }
  return client;
}

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
