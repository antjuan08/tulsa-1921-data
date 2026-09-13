import { Sparkles, Tv, Award, Infinity as InfinityIcon } from 'lucide-react';

const PROPS = [
  {
    icon: Sparkles,
    title: 'Taught by the masters',
    body: 'Learn from the people who actually shape the field — Grammy winners, Pulitzer authors, Michelin chefs.',
  },
  {
    icon: Tv,
    title: 'Cinematic on every screen',
    body: 'Watch on the web today. Apple TV, Android TV, and Fire TV apps coming next.',
  },
  {
    icon: Award,
    title: 'Made to be finished',
    body: 'Short, focused lessons (10–25 min) with downloadable workbooks. Most classes finish in a week.',
  },
  {
    icon: InfinityIcon,
    title: 'New classes every month',
    body: 'One subscription, the whole catalog, plus first access to every new release.',
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-10">
      <div className="mb-14 max-w-2xl">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          Why Lumen
        </div>
        <h2 className="mt-3 font-serif text-4xl lg:text-5xl">
          Built for people who actually want to make something.
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/5 md:grid-cols-2 lg:grid-cols-4">
        {PROPS.map((p) => (
          <div key={p.title} className="bg-[var(--color-bg-surface)] p-8">
            <p.icon className="text-[var(--color-accent)]" size={28} strokeWidth={1.5} />
            <h3 className="mt-6 font-serif text-2xl text-white">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg-secondary)]">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
