import { listPublishedCourses } from '@/lib/queries';
import { formatRuntime } from '@/lib/utils';

export default async function AdminCoursesPage() {
  const rows = await listPublishedCourses();
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-bg-elevated)] text-xs uppercase tracking-wider text-[var(--color-fg-secondary)]">
          <tr>
            <th className="px-5 py-4">Title</th>
            <th className="px-5 py-4">Instructor</th>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">Lessons</th>
            <th className="px-5 py-4">Runtime</th>
            <th className="px-5 py-4">Published</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(({ course, instructor, category }) => (
            <tr key={course.id} className="bg-[var(--color-bg-surface)]">
              <td className="px-5 py-4 text-white">{course.title}</td>
              <td className="px-5 py-4 text-[var(--color-fg-secondary)]">{instructor.name}</td>
              <td className="px-5 py-4 text-[var(--color-fg-secondary)]">{category.name}</td>
              <td className="px-5 py-4 text-[var(--color-fg-secondary)]">{course.lessonCount}</td>
              <td className="px-5 py-4 text-[var(--color-fg-secondary)]">
                {formatRuntime(course.durationMinutes)}
              </td>
              <td className="px-5 py-4 text-[var(--color-fg-secondary)]">
                {course.publishedAt?.toLocaleDateString() ?? 'Draft'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
