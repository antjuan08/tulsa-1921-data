import Link from 'next/link';
import { listPublishedCourses, listCategories } from '@/lib/queries';
import { CourseCard } from '@/components/catalog/course-card';

export const metadata = { title: 'Browse all classes' };

export default async function BrowsePage() {
  const [items, categories] = await Promise.all([listPublishedCourses(), listCategories()]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
      <div className="mb-12 max-w-3xl">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          The catalog
        </div>
        <h1 className="mt-3 font-serif text-5xl lg:text-6xl">All classes</h1>
        <p className="mt-5 text-lg text-[var(--color-fg-secondary)]">
          Browse every class on Lumen. Filter by category or scroll through the full catalog.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <Link
          href="/browse"
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white"
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--color-fg-secondary)] transition hover:border-white/25 hover:text-white"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-[var(--color-fg-secondary)]">
          No classes yet. Run <code className="text-white">pnpm db:seed</code> to populate the
          catalog.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ course, instructor, category }) => (
            <CourseCard
              key={course.id}
              course={course}
              instructor={instructor}
              category={category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
