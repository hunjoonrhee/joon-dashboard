'use client';

import { upsertWithUser } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/**
 * Fires exactly once ever per settingsKey, the first time `isUnlocked` is
 * true. Backed by the `settings` table (not localStorage) so the flag is
 * tied to the account, not one browser - a user switching devices or
 * clearing site data doesn't see the celebration replay.
 */
export function useOneTimeUnlockDetector(
  settingsKey: string | null,
  settings: Record<string, string> | undefined,
  isUnlocked: boolean,
  onUnlocked: () => void
) {
  const checkedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!settingsKey || !isUnlocked || settings === undefined) return;
    if (checkedRef.current === settingsKey) return;
    checkedRef.current = settingsKey;

    if (settings[settingsKey] === undefined) {
      onUnlocked();
      upsertWithUser('settings', { key: settingsKey, value: '1' }, { onConflict: 'key,user_id' }).then(() =>
        queryClient.invalidateQueries({ queryKey: ['settings'] })
      );
    }
  }, [settingsKey, settings, isUnlocked, onUnlocked, queryClient]);
}
