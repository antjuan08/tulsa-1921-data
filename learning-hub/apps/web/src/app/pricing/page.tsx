import { PriceTable } from '@/components/marketing/price-table';

export const metadata = { title: 'Pricing' };

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
          Membership
        </div>
        <h1 className="mt-4 font-serif text-6xl">One subscription. Every class.</h1>
        <p className="mt-6 text-lg text-[var(--color-fg-secondary)]">
          Watch unlimited classes from world-class instructors. Cancel anytime, no questions
          asked.
        </p>
      </div>
      <div className="mt-16">
        <PriceTable />
      </div>
      <div className="mx-auto mt-16 max-w-2xl px-6 text-center text-sm text-[var(--color-fg-muted)]">
        Test mode is enabled. Use card{' '}
        <code className="text-white">4242 4242 4242 4242</code>, any future expiry, any CVC.
      </div>
    </div>
  );
}
