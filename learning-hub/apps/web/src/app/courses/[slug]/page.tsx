import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { getCourseBySlug } from '@/lib/queries';
import { getEntitlement } from '@/lib/entitlement';
import { LessonList } from '@/components/course/lesson-list';
import { StreamPlayer } from '@/components/player/stream-player';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRuntime } from '@/lib/utils';
import { Clock, ListVideo, Star } from 'lucide-react';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  return {
    title: data ? `${data.course.title} — ${data.instructor.name}` : 'Course',
    description: data?.course.tagline,
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getCourseBySlug(slug);
  if (!data) return notFound();
  const { userId } = await auth();
  const entitlement = await getEntitlement(userId);
  const firstPlayable =
    data.lessons.find((l) => l.isFreePreview || entitlement.active) ?? data.lessons[0];

  return (
    <div className="-mt-16">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden">
        <Image
          src={data.instructor.heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-base)]/90 via-[var(--color-bg-base)]/40 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-14 lg:px-10">
          <Badge className="mb-5 self-start">{data.category.name}</Badge>
          <div className="font-serif text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            A class by {data.instructor.name}
          </div>
          <h1 className="mt-3 max-w-3xl text-balance font-serif text-5xl leading-[1.05] lg:text-7xl">
            {data.course.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--color-fg-secondary)]">
            {data.course.tagline}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[var(--color-fg-secondary)]">
            <span className="inline-flex items-center gap-2">
              <ListVideo size={16} /> {data.course.lessonCount} lessons
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} /> {formatRuntime(data.course.durationMinutes)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Star size={16} className="text-[var(--color-accent)]" /> 4.8 (1.2k)
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {firstPlayable && (
              <Button asChild size="lg">
                <Link
                  href={
                    entitlement.active || firstPlayable.isFreePreview
                      ? `/watch/${firstPlayable.id}`
                      : '/pricing'
                  }
                >
                  {entitlement.active ? 'Start watching' : 'Watch free preview'}
                </Link>
              </Button>
            )}
            {!entitlement.active && (
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">Subscribe</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-[1.6fr_1fr] lg:px-10">
        <div className="space-y-10">
          {data.course.trailerStreamUid && (
            <div>
              <h2 className="mb-5 font-serif text-3xl">Trailer</h2>
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                <StreamPlayer uidOrToken={data.course.trailerStreamUid} />
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-5 font-serif text-3xl">About this class</h2>
            <p className="text-lg leading-relaxed text-[var(--color-fg-secondary)]">
              {data.course.description}
            </p>
          </div>

          <div>
            <h2 className="mb-5 font-serif text-3xl">Lessons</h2>
            <LessonList lessons={data.lessons} entitled={entitlement.active} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-[var(--color-bg-surface)] p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Your instructor
            </div>
            <div className="mt-4 flex items-center gap-4">
              {data.instructor.portraitImageUrl && (
                <Image
                  src={data.instructor.portraitImageUrl}
                  alt={data.instructor.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
                />
              )}
              <div>
                <div className="font-serif text-xl text-white">{data.instructor.name}</div>
                <div className="text-sm text-[var(--color-fg-secondary)]">
                  {data.instructor.headline}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[var(--color-fg-secondary)]">
              {data.instructor.bio}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
