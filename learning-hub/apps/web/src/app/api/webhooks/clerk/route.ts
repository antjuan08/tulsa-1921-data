import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { db, users } from '@ott/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET missing' }, { status: 500 });
  }
  const svixId = req.headers.get('svix-id');
  const svixTs = req.headers.get('svix-timestamp');
  const svixSig = req.headers.get('svix-signature');
  if (!svixId || !svixTs || !svixSig) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }
  const body = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTs,
      'svix-signature': svixSig,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[clerk webhook] verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const data = event.data;
      const email = data.email_addresses?.[0]?.email_address;
      if (!email) break;
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
      await db
        .insert(users)
        .values({
          id: data.id,
          email,
          name,
          imageUrl: data.image_url ?? null,
          role: 'member',
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { email, name, imageUrl: data.image_url ?? null, updatedAt: new Date() },
        });
      break;
    }
    case 'user.deleted': {
      const id = event.data.id;
      if (id) await db.delete(users).where(eq(users.id, id));
      break;
    }
  }
  return NextResponse.json({ received: true });
}
