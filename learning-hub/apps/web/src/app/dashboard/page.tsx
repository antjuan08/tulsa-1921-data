import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { listPublishedCourses, getContinueWatching } from '@/lib/queries';
import { getEntitlement } from '@/lib/entitlement';
import { CourseCard } from '@/components/catalog/course-card';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/dashboard');
  const [user, entitlement, [allCourses, continueWatching]] = await Promise.all([
    currentUser(),
    getEntitlement(userId),
    Promise.all([listPublishedCourses(), getContinueWatching(userId)]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Your library
          </div>
          <h1 className="mt-3 font-serif text-5xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.
          </h1>
        </div>
        {!entitlement.active && (
          <Button asChild>
            <Link href="/pricing">Subscribe to watch</Link>
          </Button>
        )}
      </div>

      {continueWatching.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 font-serif text-3xl">Continue watching</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {continueWatching.map((row) => (
              <Link
                key={row.lesson.id}
                href={`/watch/${row.lesson.id}`}
                className="group relative overflow-hidden rounded-lg bg-[var(--color-bg-surface)]"
              >
                <div
                  className="relative aspect-[16/10] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${row.course.posterImageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wider text-[var(--color-fg-secondary)]">
                    {row.course.title}
                  </div>
                  <div className="mt-1 text-base text-white">{row.lesson.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-6 font-serif text-3xl">For you</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCourses.map(({ course, instructor, category }) => (
            <CourseCard
              key={course.id}
              course={course}
              instructor={instructor}
              category={category}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
