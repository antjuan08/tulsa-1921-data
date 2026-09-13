import { notFound } from 'next/navigation';
import { listCoursesByCategory } from '@/lib/queries';
import { CourseCard } from '@/components/catalog/course-card';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  return { title: `${slug.replace(/-/g, ' ')} classes` };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { category, items } = await listCoursesByCategory(slug);
  if (!category) return notFound();
  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
      <div className="mb-12 max-w-3xl">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          Category
        </div>
        <h1 className="mt-3 font-serif text-5xl lg:text-6xl">{category.name}</h1>
        {category.description && (
          <p className="mt-5 text-lg text-[var(--color-fg-secondary)]">{category.description}</p>
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-[var(--color-fg-secondary)]">
          No classes in this category yet.
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
