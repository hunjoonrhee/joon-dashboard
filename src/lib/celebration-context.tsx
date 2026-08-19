'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { CelebrationColorTheme } from '@/components/celebration/celebration-themes';

export type { CelebrationColorTheme };

export type CelebrationOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Drives the dial fill animation. Defaults to 100 if omitted. */
  percent?: number;
  /** Non-percent numeric center (e.g. streak day count). */
  centerLabel?: { value: string; caption?: string };
  /** Badge icon shown in the dial center instead - takes priority over centerLabel and percent text if set. */
  centerIcon?: ReactNode;
  /** Milestone tier, not light/dark mode. */
  colorTheme?: CelebrationColorTheme;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

type CelebrationContextValue = {
  queue: CelebrationOptions[];
  showCelebration: (options: CelebrationOptions) => void;
  clearQueue: () => void;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<CelebrationOptions[]>([]);

  // Every pending celebration is appended, not deduped or replaced - if two
  // detectors fire in the same tick, both show up as separate swipeable
  // cards rather than one silently dropping the other.
  const showCelebration = useCallback((options: CelebrationOptions) => {
    setQueue((current) => [...current, options]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return (
    <CelebrationContext.Provider value={{ queue, showCelebration, clearQueue }}>{children}</CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebration must be used within a CelebrationProvider');
  return ctx.showCelebration;
}

export function useCelebrationQueue() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebrationQueue must be used within a CelebrationProvider');
  return { queue: ctx.queue, clearQueue: ctx.clearQueue };
}
