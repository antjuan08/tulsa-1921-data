import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { db, lessons } from '@ott/db';
import { eq, asc } from 'drizzle-orm';
import { getLessonWithCourse } from '@/lib/queries';
import { getEntitlement } from '@/lib/entitlement';
import { hasStreamSigning, signPlaybackToken } from '@/lib/stream';
import { StreamPlayer } from '@/components/player/stream-player';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';

type Params = Promise<{ lessonId: string }>;

export default async function WatchPage({ params }: { params: Params }) {
  const { lessonId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/watch/${lessonId}`);

  const data = await getLessonWithCourse(lessonId);
  if (!data) return notFound();

  const entitlement = await getEntitlement(userId);
  if (!entitlement.active && !data.lesson.isFreePreview) {
    redirect(`/pricing?from=/watch/${lessonId}`);
  }

  // Mint a signed token if Cloudflare signing keys are configured; otherwise use the public UID.
  // Seeded demo videos work with unsigned playback so the dev environment plays out of the box.
  const playbackId = hasStreamSigning()
    ? signPlaybackToken({ videoUid: data.lesson.streamUid, userId }).token
    : data.lesson.streamUid;

  // Build the lesson list for the next-lesson rail.
  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, data.course.id))
    .orderBy(asc(lessons.order));

  const currentIndex = courseLessons.findIndex((l) => l.id === data.lesson.id);
  const nextLesson = courseLessons[currentIndex + 1];

  return (
    <div className="bg-[var(--color-bg-base)]">
      <div className="border-b border-white/5 px-6 py-4 lg:px-10">
        <Link
          href={`/courses/${data.course.slug}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-secondary)] hover:text-white"
        >
          <ArrowLeft size={16} /> Back to {data.course.title}
        </Link>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-10">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
          <StreamPlayer uidOrToken={playbackId} autoplay />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Lesson {String(data.lesson.order).padStart(2, '0')} ·{' '}
              {data.course.title}
            </div>
            <h1 className="mt-3 font-serif text-4xl lg:text-5xl">{data.lesson.title}</h1>
            {data.lesson.description && (
              <p className="mt-5 text-lg leading-relaxed text-[var(--color-fg-secondary)]">
                {data.lesson.description}
              </p>
            )}
          </div>
          <aside className="rounded-xl border border-white/5 bg-[var(--color-bg-surface)] p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Up next
            </div>
            {nextLesson ? (
              <>
                <div className="mt-3 font-serif text-2xl text-white">{nextLesson.title}</div>
                <Button asChild className="mt-5 w-full">
                  <Link href={`/watch/${nextLesson.id}`}>
                    Play next lesson <ChevronRight size={18} />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <div className="mt-3 font-serif text-2xl text-white">You've finished the class.</div>
                <Button asChild variant="secondary" className="mt-5 w-full">
                  <Link href="/browse">Find another class</Link>
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
