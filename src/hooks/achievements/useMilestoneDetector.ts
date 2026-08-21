'use client';

import { upsertWithUser } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Fires once whenever `current` crosses a milestone it hasn't crossed
 * before (highest one crossed, if it skipped several at once), tracked
 * per-account in the `settings` table (not localStorage) so it survives
 * across devices and browser data resets. A user seen for the first time
 * is only seeded silently - it does not fire for whatever milestone their
 * existing count already exceeds.
 */
export function useMilestoneDetector(
  settingsKey: string | null,
  settings: Record<string, string> | undefined,
  milestones: readonly number[],
  current: number | null | undefined,
  onMilestoneReached: (milestone: number) => void
) {
  const checkedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!settingsKey || current == null || settings === undefined) return;
    const dedupeKey = `${settingsKey}:${current}`;
    if (checkedRef.current === dedupeKey) return;
    checkedRef.current = dedupeKey;

    const storedRaw = settings[settingsKey];
    const stored = storedRaw !== undefined ? Number(storedRaw) : null;

    if (stored !== null) {
      const crossed = milestones.filter((m) => stored < m && m <= current);
      const highest = crossed[crossed.length - 1];
      if (highest !== undefined) onMilestoneReached(highest);
    }
    if (stored !== current) {
      upsertWithUser('settings', { key: settingsKey, value: String(current) }, { onConflict: 'key,user_id' }).then(
        () => queryClient.invalidateQueries({ queryKey: ['settings'] })
      );
    }
  }, [settingsKey, settings, current, milestones, onMilestoneReached, queryClient]);
}
