import Stripe from 'stripe';

let client: Stripe | null = null;

/** Server-only. Instantiated lazily so a missing env var only breaks billing routes, not the whole build. */
export function getStripeClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' });
  }
  return client;
}

/** Pro plan is priced per-currency; each locale bills in its market's currency. */
const PRICE_ID_BY_LOCALE: Record<string, string> = {
  ko: process.env.STRIPE_PRO_PRICE_ID_KRW!,
  en: process.env.STRIPE_PRO_PRICE_ID_USD!,
  de: process.env.STRIPE_PRO_PRICE_ID_EUR!,
};

export function getProPriceId(locale: string): string {
  return PRICE_ID_BY_LOCALE[locale] ?? PRICE_ID_BY_LOCALE.en;
}
