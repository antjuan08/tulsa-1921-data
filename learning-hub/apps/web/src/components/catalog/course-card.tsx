import Link from 'next/link';
import Image from 'next/image';
import type { Course, Instructor, Category } from '@ott/db';
import { formatRuntime } from '@/lib/utils';

export function CourseCard({
  course,
  instructor,
  category,
}: {
  course: Course;
  instructor: Instructor;
  category: Category;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative block overflow-hidden rounded-lg bg-[var(--color-bg-surface)] transition hover:bg-[var(--color-bg-elevated)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={course.posterImageUrl}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-secondary)]">
            {category.name}
          </div>
          <div className="mt-1 font-serif text-xl text-white">{instructor.name}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-base font-medium text-white">{course.title}</div>
        <div className="mt-1 text-sm text-[var(--color-fg-secondary)]">
          {course.lessonCount} lessons · {formatRuntime(course.durationMinutes)}
        </div>
      </div>
    </Link>
  );
}
