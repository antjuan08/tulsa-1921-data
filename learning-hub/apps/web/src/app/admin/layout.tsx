import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@ott/db';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/admin');
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row || row.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-serif text-4xl">Admin access required</h1>
        <p className="mt-4 text-[var(--color-fg-secondary)]">
          Your account ({row?.email ?? userId}) is not an admin. To grant access, update your
          user's <code>role</code> column to <code>admin</code> in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Admin
          </div>
          <h1 className="mt-2 font-serif text-4xl">Lumen CMS</h1>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link
            href="/admin"
            className="rounded-md border border-white/10 px-4 py-2 hover:bg-white/5"
          >
            Overview
          </Link>
          <Link
            href="/admin/courses"
            className="rounded-md border border-white/10 px-4 py-2 hover:bg-white/5"
          >
            Courses
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
