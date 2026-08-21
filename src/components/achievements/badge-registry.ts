import type { BadgeId } from '@/lib/achievements';
import {
  BookMarked,
  Clock,
  Flag,
  Flame,
  GraduationCap,
  ListChecks,
  Mic,
  Timer,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

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
  { id: 'vocab-10-green', section: 'milestone', icon: BookMarked, tier: 'green', labelKey: 'vocab10' },
  { id: 'vocab-50-gold', section: 'milestone', icon: BookMarked, tier: 'gold', labelKey: 'vocab50' },
  { id: 'vocab-100-purple', section: 'milestone', icon: BookMarked, tier: 'purple', labelKey: 'vocab100' },
  {
    id: 'vocab-mastered-5-green',
    section: 'milestone',
    icon: GraduationCap,
    tier: 'green',
    labelKey: 'vocabMastered5',
  },
  {
    id: 'vocab-mastered-20-gold',
    section: 'milestone',
    icon: GraduationCap,
    tier: 'gold',
    labelKey: 'vocabMastered20',
  },
  {
    id: 'vocab-mastered-50-purple',
    section: 'milestone',
    icon: GraduationCap,
    tier: 'purple',
    labelKey: 'vocabMastered50',
  },
  { id: 'pr-longest-session', section: 'personalRecord', icon: Timer, tier: 'gold', labelKey: 'prLongestSession' },
  { id: 'pr-pronunciation', section: 'personalRecord', icon: Mic, tier: 'gold', labelKey: 'prPronunciation' },
  { id: 'goal-stage-complete', section: 'goal', icon: Flag, tier: 'purple', labelKey: 'goalStageComplete' },
  { id: 'goal-roadmap-100', section: 'goal', icon: Trophy, tier: 'purple', labelKey: 'goalRoadmap100' },
];

export function getBadge(id: BadgeId): BadgeMeta {
  const badge = BADGES.find((b) => b.id === id);
  if (!badge) throw new Error(`Unknown badge id: ${id}`);
  return badge;
}
