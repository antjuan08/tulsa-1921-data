import { listPublishedCourses } from '@/lib/queries';
import { Hero } from '@/components/marketing/hero';
import { ValueProps } from '@/components/marketing/value-props';
import { InstructorRail } from '@/components/marketing/instructor-rail';
import { CategoryRow } from '@/components/catalog/category-row';
import { PriceTable } from '@/components/marketing/price-table';

export default async function HomePage() {
  const all = await listPublishedCourses();
  const featured = all[0];

  return (
    <div className="-mt-16">
      {featured ? (
        <Hero
          eyebrow="New this season"
          instructor={featured.instructor.name}
          headline={featured.course.title + '.'}
          subhead={featured.course.tagline}
          heroImageUrl={featured.instructor.heroImageUrl}
          primaryCta={{ label: 'Watch trailer', href: `/courses/${featured.course.slug}` }}
          secondaryCta={{ label: 'See all classes', href: '/browse' }}
        />
      ) : (
        <Hero
          eyebrow="Welcome"
          instructor="Lumen"
          headline="Premium online classes are coming."
          subhead="Seed the database to see featured instructors and the full catalog here."
          heroImageUrl="https://images.unsplash.com/photo-1485846234645-a62644f84728?w=2400&q=80&auto=format&fit=crop"
          primaryCta={{ label: 'Browse classes', href: '/browse' }}
        />
      )}

      <InstructorRail items={all} />

      <ValueProps />

      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <CategoryRow title="New classes" href="/browse" items={all} />
      </section>

      <section className="border-t border-white/5 bg-[var(--color-bg-surface)] py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
            Membership
          </div>
          <h2 className="mt-4 font-serif text-5xl">One subscription. Every class.</h2>
          <p className="mt-5 text-lg text-[var(--color-fg-secondary)]">
            Watch unlimited classes from world-class instructors, on the web today and on TV
            soon. Cancel anytime.
          </p>
        </div>
        <div className="mt-12">
          <PriceTable />
        </div>
      </section>
    </div>
  );
}
