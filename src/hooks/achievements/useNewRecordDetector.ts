'use client';

import { upsertWithUser } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Fires whenever `currentValue` exceeds the highest value previously seen
 * for this settingsKey. Backed by the `settings` table (not localStorage)
 * so the record is tied to the account, not one browser.
 */
export function useNewRecordDetector(
  settingsKey: string | null,
  settings: Record<string, string> | undefined,
  currentValue: number | null | undefined,
  onNewRecord: (value: number) => void
) {
  const checkedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!settingsKey || currentValue == null || settings === undefined) return;
    const dedupeKey = `${settingsKey}:${currentValue}`;
    if (checkedRef.current === dedupeKey) return;
    checkedRef.current = dedupeKey;

    const storedRaw = settings[settingsKey];
    const stored = storedRaw !== undefined ? Number(storedRaw) : null;

    if (stored !== null && currentValue > stored) onNewRecord(currentValue);
    if (stored !== currentValue) {
      upsertWithUser(
        'settings',
        { key: settingsKey, value: String(currentValue) },
        { onConflict: 'key,user_id' }
      ).then(() => queryClient.invalidateQueries({ queryKey: ['settings'] }));
    }
  }, [settingsKey, settings, currentValue, onNewRecord, queryClient]);
}
