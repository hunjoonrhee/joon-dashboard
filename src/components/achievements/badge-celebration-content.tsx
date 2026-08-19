import type { AchievementStats, BadgeId } from '@/lib/achievements';
import type { CelebrationColorTheme, CelebrationOptions } from '@/lib/celebration-context';
import { getBadge } from './badge-registry';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type ReplayContent = Omit<CelebrationOptions, 'primaryLabel' | 'onPrimary'>;

const STREAK_THRESHOLDS: Partial<Record<BadgeId, number>> = {
  'streak-3-green': 3,
  'streak-7-green': 7,
  'streak-30-gold': 30,
  'streak-100-purple': 100,
};
const RECORDS_THRESHOLDS: Partial<Record<BadgeId, number>> = {
  'records-10-green': 10,
  'records-50-gold': 50,
  'records-100-purple': 100,
};
const HOURS_THRESHOLDS: Partial<Record<BadgeId, number>> = {
  'hours-10-green': 10,
  'hours-50-gold': 50,
  'hours-100-purple': 100,
};

function tierFor(value: number, purpleAt: number, goldAt: number): CelebrationColorTheme {
  return value >= purpleAt ? 'purple' : value >= goldAt ? 'gold' : 'green';
}

/** Tap-to-replay celebration copy for an already-unlocked badge on the achievements page - reuses the same CelebrationOverlay/queue machinery as a live detector firing. */
export function getBadgeCelebrationContent(
  badgeId: BadgeId,
  stats: AchievementStats,
  t: Translate
): ReplayContent | null {
  const badge = getBadge(badgeId);
  const Icon = badge.icon;
  const centerIcon = <Icon size={56} strokeWidth={1.8} />;

  if (badgeId in STREAK_THRESHOLDS) {
    const count = STREAK_THRESHOLDS[badgeId]!;
    return {
      eyebrow: t('celebration.streakMilestone.eyebrow'),
      title: t('celebration.streakMilestone.title', { count }),
      subtitle: t('celebration.streakMilestone.subtitle'),
      centerLabel: { value: String(count), caption: t('celebration.streakMilestone.dialCaption') },
      colorTheme: tierFor(count, 100, 30),
    };
  }

  if (badgeId in RECORDS_THRESHOLDS) {
    const count = RECORDS_THRESHOLDS[badgeId]!;
    return {
      eyebrow: t('celebration.recordsMilestone.eyebrow'),
      title: t('celebration.recordsMilestone.title', { count }),
      subtitle: t('celebration.recordsMilestone.subtitle'),
      centerLabel: { value: String(count), caption: t('celebration.recordsMilestone.dialCaption') },
      colorTheme: tierFor(count, 100, 50),
    };
  }

  if (badgeId in HOURS_THRESHOLDS) {
    const count = HOURS_THRESHOLDS[badgeId]!;
    return {
      eyebrow: t('celebration.hoursMilestone.eyebrow'),
      title: t('celebration.hoursMilestone.title', { count }),
      subtitle: t('celebration.hoursMilestone.subtitle'),
      centerLabel: { value: String(count), caption: t('celebration.hoursMilestone.dialCaption') },
      colorTheme: tierFor(count, 100, 50),
    };
  }

  if (badgeId === 'pr-longest-session') {
    if (stats.longestSessionMinutes === null) return null;
    return {
      eyebrow: t('celebration.longestSession.eyebrow'),
      title: t('celebration.longestSession.title'),
      subtitle: t('celebration.longestSession.subtitle', { minutes: stats.longestSessionMinutes }),
      centerIcon,
      colorTheme: 'gold',
    };
  }

  if (badgeId === 'pr-pronunciation') {
    if (stats.bestPronunciationScore === null) return null;
    return {
      eyebrow: t('celebration.pronunciation.eyebrow'),
      title: t('celebration.pronunciation.title'),
      subtitle: t('celebration.pronunciation.subtitle', { score: Math.round(stats.bestPronunciationScore) }),
      centerIcon,
      colorTheme: 'gold',
    };
  }

  if (badgeId === 'pr-saved-words') {
    return {
      eyebrow: t('celebration.savedWords.eyebrow'),
      title: t('celebration.savedWords.title'),
      subtitle: t('celebration.savedWords.subtitle', { count: stats.savedVocabWordCount }),
      centerIcon,
      colorTheme: 'gold',
    };
  }

  if (badgeId === 'goal-stage-complete') {
    return {
      eyebrow: t('celebration.stageComplete.eyebrow'),
      title: t('celebration.stageComplete.title'),
      subtitle: t('celebration.stageComplete.subtitle'),
      centerIcon,
      colorTheme: 'purple',
    };
  }

  if (badgeId === 'goal-roadmap-100') {
    return {
      eyebrow: t('celebration.roadmapComplete.eyebrow'),
      title: t('celebration.roadmapComplete.title'),
      subtitle: t('celebration.roadmapComplete.subtitle'),
      percent: 100,
      colorTheme: 'purple',
    };
  }

  return null;
}
