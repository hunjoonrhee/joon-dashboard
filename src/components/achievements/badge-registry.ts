import type { BadgeId } from '@/lib/achievements';
import { BookMarked, Clock, Flag, Flame, ListChecks, Mic, Timer, Trophy, type LucideIcon } from 'lucide-react';

export type BadgeSection = 'milestone' | 'personalRecord' | 'goal';
export type BadgeTier = 'green' | 'gold' | 'purple';

export type BadgeMeta = {
  id: BadgeId;
  section: BadgeSection;
  icon: LucideIcon;
  tier: BadgeTier;
  /** Under achievements.badges.<labelKey> in the locale files. */
  labelKey: string;
};

// Grouped/ordered to match growpath-mobile's badge-registry.ts: milestone -> personalRecord -> goal.
export const BADGES: BadgeMeta[] = [
  { id: 'streak-3-green', section: 'milestone', icon: Flame, tier: 'green', labelKey: 'streak3' },
  { id: 'streak-7-green', section: 'milestone', icon: Flame, tier: 'green', labelKey: 'streak7' },
  { id: 'streak-30-gold', section: 'milestone', icon: Flame, tier: 'gold', labelKey: 'streak30' },
  { id: 'streak-100-purple', section: 'milestone', icon: Flame, tier: 'purple', labelKey: 'streak100' },
  { id: 'records-10-green', section: 'milestone', icon: ListChecks, tier: 'green', labelKey: 'records10' },
  { id: 'records-50-gold', section: 'milestone', icon: ListChecks, tier: 'gold', labelKey: 'records50' },
  { id: 'records-100-purple', section: 'milestone', icon: ListChecks, tier: 'purple', labelKey: 'records100' },
  { id: 'hours-10-green', section: 'milestone', icon: Clock, tier: 'green', labelKey: 'hours10' },
  { id: 'hours-50-gold', section: 'milestone', icon: Clock, tier: 'gold', labelKey: 'hours50' },
  { id: 'hours-100-purple', section: 'milestone', icon: Clock, tier: 'purple', labelKey: 'hours100' },
  { id: 'pr-longest-session', section: 'personalRecord', icon: Timer, tier: 'gold', labelKey: 'prLongestSession' },
  { id: 'pr-pronunciation', section: 'personalRecord', icon: Mic, tier: 'gold', labelKey: 'prPronunciation' },
  { id: 'pr-saved-words', section: 'personalRecord', icon: BookMarked, tier: 'gold', labelKey: 'prSavedWords' },
  { id: 'goal-stage-complete', section: 'goal', icon: Flag, tier: 'purple', labelKey: 'goalStageComplete' },
  { id: 'goal-roadmap-100', section: 'goal', icon: Trophy, tier: 'purple', labelKey: 'goalRoadmap100' },
];

export function getBadge(id: BadgeId): BadgeMeta {
  const badge = BADGES.find((b) => b.id === id);
  if (!badge) throw new Error(`Unknown badge id: ${id}`);
  return badge;
}
