'use client';

import { useEffect, useRef } from 'react';

/** Fires exactly once ever per storageKey, the first time `isUnlocked` is true. */
export function useOneTimeUnlockDetector(storageKey: string | null, isUnlocked: boolean, onUnlocked: () => void) {
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!storageKey || !isUnlocked) return;
    if (checkedRef.current === storageKey) return;
    checkedRef.current = storageKey;

    const already = window.localStorage.getItem(storageKey);
    if (already === null) {
      onUnlocked();
      window.localStorage.setItem(storageKey, '1');
    }
  }, [storageKey, isUnlocked, onUnlocked]);
}
