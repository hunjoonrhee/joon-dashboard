'use client';

import { useEffect, useRef } from 'react';

/**
 * Fires once whenever `current` crosses a milestone it hasn't crossed
 * before (highest one crossed, if it skipped several at once), tracked
 * per-user in localStorage so it survives reloads. A user seen for the
 * first time is only seeded silently - it does not fire for whatever
 * milestone their existing count already exceeds.
 */
export function useMilestoneDetector(
  storageKey: string | null,
  milestones: readonly number[],
  current: number | null | undefined,
  onMilestoneReached: (milestone: number) => void
) {
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!storageKey || current == null) return;
    const dedupeKey = `${storageKey}:${current}`;
    if (checkedRef.current === dedupeKey) return;
    checkedRef.current = dedupeKey;

    const storedRaw = window.localStorage.getItem(storageKey);
    const stored = storedRaw !== null ? Number(storedRaw) : null;

    if (stored !== null) {
      const crossed = milestones.filter((m) => stored < m && m <= current);
      const highest = crossed[crossed.length - 1];
      if (highest !== undefined) onMilestoneReached(highest);
    }
    if (stored !== current) {
      window.localStorage.setItem(storageKey, String(current));
    }
  }, [storageKey, current, milestones, onMilestoneReached]);
}
