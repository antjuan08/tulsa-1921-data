import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@ott/db';
import { eq } from 'drizzle-orm';
import { requireStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 });
  }
  const stripe = requireStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/account`,
  });
  return NextResponse.redirect(session.url, 303);
}
