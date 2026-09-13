import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users } from '@ott/db';
import { eq } from 'drizzle-orm';
import { requireStripe, priceIdForPlan, type PlanId } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { plan?: PlanId };
    const plan = body.plan ?? 'monthly';
    if (plan !== 'monthly' && plan !== 'annual') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = requireStripe();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    // Reuse existing Stripe customer if we have one
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    let customerId = dbUser?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { clerkUserId: userId },
      });
      customerId = customer.id;
      if (dbUser) {
        await db
          .update(users)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { clerkUserId: userId, plan },
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a URL' }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] error', err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
