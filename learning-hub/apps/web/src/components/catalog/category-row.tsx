import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Course, Instructor, Category } from '@ott/db';
import { CourseCard } from './course-card';

export function CategoryRow({
  title,
  href,
  items,
}: {
  title: string;
  href?: string;
  items: { course: Course; instructor: Instructor; category: Category }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <h2 className="font-serif text-3xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-secondary)] transition hover:text-white"
          >
            See all <ChevronRight size={16} />
          </Link>
        )}
      </div>
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
    </section>
  );
}
