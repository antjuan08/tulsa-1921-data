import { db, subscriptions } from '@ott/db';
import { eq } from 'drizzle-orm';
import type { Entitlement } from '@ott/types';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export async function getEntitlement(userId: string | null): Promise<Entitlement> {
  if (!userId) return { active: false, plan: null, currentPeriodEnd: null };
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (!sub) return { active: false, plan: null, currentPeriodEnd: null };
  const active =
    ACTIVE_STATUSES.has(sub.status) && sub.currentPeriodEnd.getTime() > Date.now() - 60_000;
  return {
    active,
    plan: active ? sub.plan : null,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}
