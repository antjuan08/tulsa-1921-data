import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[var(--color-bg-surface)] py-16">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-10 px-6 text-sm text-[var(--color-fg-muted)] md:grid-cols-5 lg:px-10">
        <div className="col-span-2 md:col-span-2">
          <div className="font-serif text-2xl text-white">
            Lumen<span className="text-[var(--color-accent)]">.</span>
          </div>
          <p className="mt-4 max-w-sm leading-relaxed">
            Premium online classes from the people who shape the work — filmmakers, songwriters,
            chefs, designers, scientists.
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white">Watch</div>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/browse" className="hover:text-white">
                All classes
              </Link>
            </li>
            <li>
              <Link href="/categories/filmmaking" className="hover:text-white">
                Filmmaking
              </Link>
            </li>
            <li>
              <Link href="/categories/music" className="hover:text-white">
                Music
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white">Account</div>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/pricing" className="hover:text-white">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white">
                Subscription
              </Link>
            </li>
            <li>
              <Link href="/sign-in" className="hover:text-white">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white">Apps</div>
          <ul className="mt-4 space-y-2">
            <li>Web</li>
            <li>Apple TV (soon)</li>
            <li>Android TV (soon)</li>
            <li>Roku (soon)</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1440px] border-t border-white/5 px-6 pt-8 text-xs text-[var(--color-fg-muted)] lg:px-10">
        © {new Date().getFullYear()} Lumen Learning, Inc. All rights reserved.
      </div>
    </footer>
  );
}
