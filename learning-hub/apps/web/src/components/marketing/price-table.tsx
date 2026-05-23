'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlanCard = {
  id: 'monthly' | 'annual';
  label: string;
  price: number;
  period: string;
  badge?: string;
  perks: string[];
};

const PLANS: PlanCard[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 19,
    period: '/month',
    perks: [
      'All current and future classes',
      'Watch on web and TV',
      'Cancel anytime',
      'New classes every month',
    ],
  },
  {
    id: 'annual',
    label: 'Annual',
    price: 15,
    period: '/month, billed yearly',
    badge: 'Best value · Save 21%',
    perks: [
      'Everything in Monthly',
      '$180 billed once per year',
      '7-day free trial',
      'First access to new releases',
    ],
  },
];

export function PriceTable() {
  const [loading, setLoading] = useState<PlanCard['id'] | null>(null);

  async function handleCheckout(plan: PlanCard['id']) {
    setLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Checkout failed' }));
        alert(error ?? 'Checkout failed');
        setLoading(null);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 md:grid-cols-2">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            'relative flex flex-col rounded-2xl border p-8',
            plan.badge
              ? 'border-[var(--color-accent)]/60 bg-[var(--color-bg-elevated)]'
              : 'border-white/10 bg-[var(--color-bg-surface)]',
          )}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-4 py-1 text-xs font-semibold text-[var(--color-accent-foreground)]">
              {plan.badge}
            </div>
          )}
          <div className="font-serif text-2xl">{plan.label}</div>
          <div className="mt-6 flex items-baseline">
            <span className="font-serif text-6xl">${plan.price}</span>
            <span className="ml-2 text-sm text-[var(--color-fg-secondary)]">{plan.period}</span>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm text-[var(--color-fg-secondary)]">
            {plan.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <Check className="mt-0.5 flex-none text-[var(--color-accent)]" size={18} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <Button
            className="mt-8 w-full"
            size="lg"
            variant={plan.badge ? 'primary' : 'secondary'}
            onClick={() => handleCheckout(plan.id)}
            disabled={loading !== null}
          >
            {loading === plan.id ? 'Redirecting…' : `Start ${plan.label.toLowerCase()}`}
          </Button>
        </div>
      ))}
    </div>
  );
}
