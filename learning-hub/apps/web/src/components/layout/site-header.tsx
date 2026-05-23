import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--color-bg-base)]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            Lumen<span className="text-[var(--color-accent)]">.</span>
          </Link>
          <nav className="hidden gap-8 text-sm text-[var(--color-fg-secondary)] md:flex">
            <Link href="/browse" className="transition hover:text-white">
              Browse
            </Link>
            <Link href="/categories/filmmaking" className="transition hover:text-white">
              Filmmaking
            </Link>
            <Link href="/categories/music" className="transition hover:text-white">
              Music
            </Link>
            <Link href="/pricing" className="transition hover:text-white">
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <UserButton
              appearance={{
                elements: { avatarBox: 'h-9 w-9 ring-2 ring-white/10' },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
