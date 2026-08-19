import { calcMaxStreak } from '@/lib/streak';
import type { AiRoadmap, Goal, Session } from '@/types';

export type BadgeId =
  | 'streak-3-green'
  | 'streak-7-green'
  | 'streak-30-gold'
  | 'streak-100-purple'
  | 'records-10-green'
  | 'records-50-gold'
  | 'records-100-purple'
  | 'hours-10-green'
  | 'hours-50-gold'
  | 'hours-100-purple'
  | 'pr-longest-session'
  | 'pr-pronunciation'
  | 'pr-saved-words'
  | 'goal-stage-complete'
  | 'goal-roadmap-100';

export type AchievementStats = {
  /** Longest run of consecutive study days ever - a milestone stays earned even after a later gap breaks the live streak. */
  longestStreakEver: number;
  totalSessionCount: number;
  totalStudyMinutes: number;
  longestSessionMinutes: number | null;
  longestSessionDate: string | null;
  /** Not persisted anywhere on web yet (pronunciation scoring is request-only, never saved) - always null until a future vocab/pronunciation phase adds storage. */
  bestPronunciationScore: number | null;
  bestPronunciationDate: string | null;
  /** No vocab feature on web yet - always 0 for the same reason as bestPronunciationScore. */
  savedVocabWordCount: number;
  /** From the currently adopted roadmap only. */
  currentStageLevel: number | null;
  totalStages: number | null;
};

const HOURS_TO_MINUTES = 60;

/**
 * Records/hours/pr/goal badges unlock off cumulative or max-so-far stats,
 * which can only go up - so "unlocked" is just "stat meets threshold right
 * now". Streak is the one exception (a live streak can reset), which is why
 * it's fed longestStreakEver instead of the current streak.
 */
export function computeUnlockedBadges(stats: AchievementStats): Record<BadgeId, boolean> {
  return {
    'streak-3-green': stats.longestStreakEver >= 3,
    'streak-7-green': stats.longestStreakEver >= 7,
    'streak-30-gold': stats.longestStreakEver >= 30,
    'streak-100-purple': stats.longestStreakEver >= 100,
    'records-10-green': stats.totalSessionCount >= 10,
    'records-50-gold': stats.totalSessionCount >= 50,
    'records-100-purple': stats.totalSessionCount >= 100,
    'hours-10-green': stats.totalStudyMinutes >= 10 * HOURS_TO_MINUTES,
    'hours-50-gold': stats.totalStudyMinutes >= 50 * HOURS_TO_MINUTES,
    'hours-100-purple': stats.totalStudyMinutes >= 100 * HOURS_TO_MINUTES,
    'pr-longest-session': stats.longestSessionMinutes !== null,
    'pr-pronunciation': stats.bestPronunciationScore !== null,
    'pr-saved-words': stats.savedVocabWordCount > 0,
    'goal-stage-complete': (stats.currentStageLevel ?? 0) > 1,
    'goal-roadmap-100':
      stats.currentStageLevel !== null && stats.totalStages !== null && stats.currentStageLevel >= stats.totalStages,
  };
}

/**
 * Derives achievement stats from data the dashboard already fetches
 * (sessions, goals, adopted roadmap) instead of separate queries -
 * mobile computes this via 3 extra Supabase round-trips, but web's
 * sessions/goals are already in the query cache by the time any screen
 * needs this.
 */
export function computeAchievementStats(
  sessions: Session[],
  goals: Goal[],
  adoptedRoadmap: AiRoadmap | null
): AchievementStats {
  const longestSession = sessions.reduce<{ minutes: number; date: string } | null>((best, s) => {
    if (s.duration_minutes === null) return best;
    if (best === null || s.duration_minutes > best.minutes) return { minutes: s.duration_minutes, date: s.date };
    return best;
  }, null);

  const completedStages = goals.filter(
    (g) => g.is_auto_generated && g.stage_level !== null && g.status === 'completed'
  ).length;

  return {
    longestStreakEver: calcMaxStreak(sessions),
    totalSessionCount: sessions.length,
    totalStudyMinutes: sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0),
    longestSessionMinutes: longestSession?.minutes ?? null,
    longestSessionDate: longestSession?.date ?? null,
    bestPronunciationScore: null,
    bestPronunciationDate: null,
    savedVocabWordCount: 0,
    currentStageLevel: adoptedRoadmap ? 1 + completedStages : null,
    totalStages: adoptedRoadmap ? adoptedRoadmap.stages.length : null,
  };
}
