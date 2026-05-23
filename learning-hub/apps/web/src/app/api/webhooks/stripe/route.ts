import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db, subscriptions, users } from '@ott/db';
import { eq } from 'drizzle-orm';
import { requireStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const stripe = requireStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET missing' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const clerkUserId =
          (sub.metadata?.clerkUserId as string | undefined) ?? (await resolveUserIdFromCustomer(sub.customer));
        if (!clerkUserId) {
          console.warn('[stripe webhook] no user found for subscription', sub.id);
          break;
        }
        const plan = (sub.metadata?.plan as 'monthly' | 'annual' | undefined) ?? inferPlan(sub);
        const periodEnd = new Date(sub.current_period_end * 1000);

        await db
          .insert(subscriptions)
          .values({
            userId: clerkUserId,
            stripeSubscriptionId: sub.id,
            status: sub.status as (typeof subscriptions.$inferInsert)['status'],
            plan,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeSubscriptionId: sub.id,
              status: sub.status as (typeof subscriptions.$inferInsert)['status'],
              plan,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              updatedAt: new Date(),
            },
          });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (typeof subId === 'string') {
          await db
            .update(subscriptions)
            .set({ status: 'past_due', updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, subId));
        }
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] handler error', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}

function inferPlan(sub: Stripe.Subscription): 'monthly' | 'annual' {
  const item = sub.items.data[0];
  const interval = item?.price.recurring?.interval;
  return interval === 'year' ? 'annual' : 'monthly';
}

async function resolveUserIdFromCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const customerId = typeof customer === 'string' ? customer : customer.id;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}
