'use client';

import { useEffect, useRef } from 'react';

/** Fires whenever `currentValue` exceeds the highest value previously seen for this storageKey. */
export function useNewRecordDetector(
  storageKey: string | null,
  currentValue: number | null | undefined,
  onNewRecord: (value: number) => void
) {
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!storageKey || currentValue == null) return;
    const dedupeKey = `${storageKey}:${currentValue}`;
    if (checkedRef.current === dedupeKey) return;
    checkedRef.current = dedupeKey;

    const storedRaw = window.localStorage.getItem(storageKey);
    const stored = storedRaw !== null ? Number(storedRaw) : null;

    if (stored !== null && currentValue > stored) onNewRecord(currentValue);
    if (stored !== currentValue) {
      window.localStorage.setItem(storageKey, String(currentValue));
    }
  }, [storageKey, currentValue, onNewRecord]);
}
