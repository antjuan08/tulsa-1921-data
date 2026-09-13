import { NextResponse } from 'next/server';
import { db, lessons } from '@ott/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

// Cloudflare Stream sends a webhook when a video finishes processing.
// Docs: https://developers.cloudflare.com/stream/manage-video-library/receive-webhook-notifications/
const StreamWebhookSchema = z.object({
  uid: z.string(),
  status: z.object({ state: z.string() }).optional(),
  readyToStream: z.boolean().optional(),
  duration: z.number().optional(),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof StreamWebhookSchema>;
  try {
    payload = StreamWebhookSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  // Optional HMAC verification:
  //   https://developers.cloudflare.com/stream/manage-video-library/receive-webhook-notifications/#verify-webhook
  // Left as TODO for production — needs CLOUDFLARE_STREAM_WEBHOOK_SECRET in env.

  const status =
    payload.readyToStream || payload.status?.state === 'ready' ? 'ready' : 'processing';
  const durationSeconds = payload.duration ? Math.round(payload.duration) : undefined;

  await db
    .update(lessons)
    .set({
      status,
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    })
    .where(eq(lessons.streamUid, payload.uid));

  return NextResponse.json({ received: true });
}
