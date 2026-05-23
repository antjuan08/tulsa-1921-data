import { db, courses, instructors, users, subscriptions } from '@ott/db';
import { count, eq } from 'drizzle-orm';

export default async function AdminOverview() {
  const [courseRows, instructorRows, userRows, subRows] = await Promise.all([
    db.select({ n: count() }).from(courses),
    db.select({ n: count() }).from(instructors),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
  ]);

  const stats = [
    { label: 'Courses', value: courseRows[0]?.n ?? 0 },
    { label: 'Instructors', value: instructorRows[0]?.n ?? 0 },
    { label: 'Members', value: userRows[0]?.n ?? 0 },
    { label: 'Active subs', value: subRows[0]?.n ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/5 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-[var(--color-bg-surface)] p-8">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-secondary)]">
            {s.label}
          </div>
          <div className="mt-3 font-serif text-5xl">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
