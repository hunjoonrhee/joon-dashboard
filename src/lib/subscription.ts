'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface Subscription {
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

/**
 * Pure gating rule, shared by the client hook below and any server route
 * that needs the same check: a real paid subscription (active), Stripe's
 * own trialing state (unused today, kept for when a Stripe-side trial is
 * ever added), a past_due grace period (Smart Retries is already attempting
 * recovery - don't cut access on the first missed payment), or still inside
 * our app-granted signup trial window (trial_ends_at, independent of Stripe).
 */
export function isPro(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') return true;
  return !!sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
}

export function useSubscription(userId: string | null | undefined): { subscription: Subscription | null; isPro: boolean; loading: boolean } {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('subscriptions')
      .select('status, trial_ends_at, current_period_end')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }: { data: Subscription | null }) => {
        setSubscription(data);
        setLoading(false);
      });
  }, [userId]);

  return { subscription, isPro: isPro(subscription), loading };
}
