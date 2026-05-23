import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, lessons } from '@ott/db';
import { eq } from 'drizzle-orm';
import { getEntitlement } from '@/lib/entitlement';
import { hasStreamSigning, signPlaybackToken } from '@/lib/stream';
import { z } from 'zod';

const Body = z.object({ lessonId: z.string().uuid() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, parsed.data.lessonId))
    .limit(1);
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entitlement = await getEntitlement(userId);
  if (!entitlement.active && !lesson.isFreePreview) {
    return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
  }

  if (!hasStreamSigning()) {
    // Dev fallback: return the raw UID so the iframe player uses unsigned playback.
    return NextResponse.json({ uid: lesson.streamUid, token: lesson.streamUid, expiresAt: 0 });
  }

  const { token, expiresAt } = signPlaybackToken({ videoUid: lesson.streamUid, userId });
  return NextResponse.json({ uid: lesson.streamUid, token, expiresAt });
}
