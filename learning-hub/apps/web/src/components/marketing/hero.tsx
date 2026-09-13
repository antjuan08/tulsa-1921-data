import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero({
  eyebrow,
  instructor,
  headline,
  subhead,
  heroImageUrl,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string;
  instructor: string;
  headline: string;
  subhead: string;
  heroImageUrl: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}) {
  return (
    <section className="relative h-[85vh] min-h-[640px] w-full overflow-hidden">
      <Image
        src={heroImageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/60 to-[var(--color-bg-base)]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-base)]/85 via-[var(--color-bg-base)]/40 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-20 lg:px-10 lg:pb-28">
        <Badge className="mb-6 self-start">{eyebrow}</Badge>
        <div className="font-serif text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          A class by {instructor}
        </div>
        <h1 className="mt-4 max-w-3xl text-balance font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          {headline}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-fg-secondary)]">
          {subhead}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta && (
            <Button asChild size="lg" variant="secondary">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
