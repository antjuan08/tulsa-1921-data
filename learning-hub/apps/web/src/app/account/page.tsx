import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getEntitlement } from '@/lib/entitlement';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/account');
  const [user, entitlement] = await Promise.all([currentUser(), getEntitlement(userId)]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">Account</div>
      <h1 className="mt-3 font-serif text-5xl">Settings</h1>

      <section className="mt-12 rounded-xl border border-white/5 bg-[var(--color-bg-surface)] p-8">
        <div className="font-serif text-2xl">Profile</div>
        <dl className="mt-6 grid grid-cols-[140px_1fr] gap-y-4 text-sm">
          <dt className="text-[var(--color-fg-secondary)]">Name</dt>
          <dd>{user?.fullName ?? '—'}</dd>
          <dt className="text-[var(--color-fg-secondary)]">Email</dt>
          <dd>{user?.primaryEmailAddress?.emailAddress ?? '—'}</dd>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-white/5 bg-[var(--color-bg-surface)] p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-serif text-2xl">Subscription</div>
            {entitlement.active ? (
              <p className="mt-2 text-[var(--color-fg-secondary)]">
                <span className="capitalize text-white">{entitlement.plan}</span> plan · renews{' '}
                {entitlement.currentPeriodEnd?.toLocaleDateString()}
              </p>
            ) : (
              <p className="mt-2 text-[var(--color-fg-secondary)]">
                You don't have an active subscription.
              </p>
            )}
          </div>
          {entitlement.active ? (
            <form action="/api/billing-portal" method="POST">
              <Button variant="secondary" type="submit">
                Manage billing
              </Button>
            </form>
          ) : (
            <Button asChild>
              <Link href="/pricing">Subscribe</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
