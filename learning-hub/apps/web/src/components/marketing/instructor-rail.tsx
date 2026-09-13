import Image from 'next/image';
import Link from 'next/link';
import type { Course, Instructor, Category } from '@ott/db';

export function InstructorRail({
  items,
}: {
  items: { course: Course; instructor: Instructor; category: Category }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Featured instructors
          </div>
          <h2 className="mt-3 font-serif text-4xl">Learn from the people who shape the work.</h2>
        </div>
        <Link
          href="/browse"
          className="hidden text-sm text-[var(--color-fg-secondary)] hover:text-white md:block"
        >
          See all instructors →
        </Link>
      </div>
      <div className="scroll-snap-x no-scrollbar flex gap-5 overflow-x-auto pb-4">
        {items.map(({ course, instructor, category }) => (
          <Link
            key={instructor.id}
            href={`/courses/${course.slug}`}
            className="scroll-snap-start group relative aspect-[3/4] w-[280px] flex-none overflow-hidden rounded-xl bg-[var(--color-bg-surface)]"
          >
            <Image
              src={instructor.heroImageUrl}
              alt={instructor.name}
              fill
              sizes="280px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="text-xs uppercase tracking-wider text-[var(--color-fg-secondary)]">
                {category.name}
              </div>
              <div className="mt-1 font-serif text-2xl leading-tight text-white">
                {instructor.name}
              </div>
              <div className="mt-2 line-clamp-2 text-sm text-[var(--color-fg-secondary)]">
                Teaches {course.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
