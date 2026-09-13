import 'server-only';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key, { typescript: true }) : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Add it to .env.local to enable checkout.',
    );
  }
  return stripe;
}

export const PLANS = {
  monthly: {
    label: 'Monthly',
    price: 19,
    period: '/month',
    envKey: 'STRIPE_PRICE_MONTHLY',
  },
  annual: {
    label: 'Annual',
    price: 180,
    period: '/year',
    envKey: 'STRIPE_PRICE_ANNUAL',
    badge: 'Save 21%',
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function priceIdForPlan(plan: PlanId): string {
  const id = process.env[PLANS[plan].envKey];
  if (!id) {
    throw new Error(`Missing env ${PLANS[plan].envKey}.`);
  }
  return id;
}
