'use client';

import { getBadge } from '@/components/achievements/badge-registry';
import { useMilestoneDetector } from '@/hooks/achievements/useMilestoneDetector';
import { useNewRecordDetector } from '@/hooks/achievements/useNewRecordDetector';
import { useOneTimeUnlockDetector } from '@/hooks/achievements/useOneTimeUnlockDetector';
import { computeAchievementStats, type AchievementStats } from '@/lib/achievements';
import { useCelebration, type CelebrationColorTheme } from '@/lib/celebration-context';
import { usePronunciationBestScore, useSettings, useVocabWordCount } from '@/lib/queries';
import { calcStreak } from '@/lib/streak';
import type { AiRoadmap, Goal, Session } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const STREAK_MILESTONES = [3, 7, 30, 100] as const;
const RECORDS_MILESTONES = [10, 50, 100] as const;
const HOURS_MILESTONES = [10, 50, 100] as const;

function tierFor(value: number, purpleAt: number, goldAt: number): CelebrationColorTheme {
  return value >= purpleAt ? 'purple' : value >= goldAt ? 'gold' : 'green';
}

/** Wires the live milestone detectors on the home screen and fires celebrations for them - the achievements page's tap-to-replay uses the same copy keys via badge-celebration-content.tsx. */
export function useAchievementDetectors(
  userId: string | undefined,
  sessions: Session[],
  goals: Goal[],
  adoptedRoadmap: AiRoadmap | null
) {
  const t = useTranslations('achievements');
  const locale = useLocale();
  const router = useRouter();
  const showCelebration = useCelebration();

  const { data: vocabWordCount = 0 } = useVocabWordCount();
  const { data: bestPronunciation = null } = usePronunciationBestScore();
  const { data: settings } = useSettings();
  const stats: AchievementStats = computeAchievementStats(
    sessions,
    goals,
    adoptedRoadmap,
    vocabWordCount,
    bestPronunciation
  );
  const currentStreak = calcStreak(sessions);

  const goTo = useCallback((path: string) => router.push(`/${locale}${path}`), [router, locale]);

  const handleStreakMilestone = useCallback(
    (milestone: number) => {
      showCelebration({
        eyebrow: t('celebration.streakMilestone.eyebrow'),
        title: t('celebration.streakMilestone.title', { count: milestone }),
        subtitle: t('celebration.streakMilestone.subtitle'),
        centerLabel: { value: String(milestone), caption: t('celebration.streakMilestone.dialCaption') },
        colorTheme: tierFor(milestone, 100, 30),
        primaryLabel: t('celebration.goToStudyCta'),
        onPrimary: () => goTo('/dashboard/study'),
      });
    },
    [showCelebration, t, goTo]
  );

  const handleRecordsMilestone = useCallback(
    (milestone: number) => {
      showCelebration({
        eyebrow: t('celebration.recordsMilestone.eyebrow'),
        title: t('celebration.recordsMilestone.title', { count: milestone }),
        subtitle: t('celebration.recordsMilestone.subtitle'),
        centerLabel: { value: String(milestone), caption: t('celebration.recordsMilestone.dialCaption') },
        colorTheme: tierFor(milestone, 100, 50),
        primaryLabel: t('celebration.viewAchievementsCta'),
        onPrimary: () => goTo('/dashboard/achievements'),
      });
    },
    [showCelebration, t, goTo]
  );

  const handleHoursMilestone = useCallback(
    (milestone: number) => {
      showCelebration({
        eyebrow: t('celebration.hoursMilestone.eyebrow'),
        title: t('celebration.hoursMilestone.title', { count: milestone }),
        subtitle: t('celebration.hoursMilestone.subtitle'),
        centerLabel: { value: String(milestone), caption: t('celebration.hoursMilestone.dialCaption') },
        colorTheme: tierFor(milestone, 100, 50),
        primaryLabel: t('celebration.viewAchievementsCta'),
        onPrimary: () => goTo('/dashboard/achievements'),
      });
    },
    [showCelebration, t, goTo]
  );

  const handleNewLongestSession = useCallback(
    (minutes: number) => {
      const Icon = getBadge('pr-longest-session').icon;
      showCelebration({
        eyebrow: t('celebration.longestSession.eyebrow'),
        title: t('celebration.longestSession.title'),
        subtitle: t('celebration.longestSession.subtitle', { minutes }),
        centerIcon: <Icon size={56} strokeWidth={1.8} />,
        colorTheme: 'gold',
        primaryLabel: t('celebration.viewAchievementsCta'),
        onPrimary: () => goTo('/dashboard/achievements'),
      });
    },
    [showCelebration, t, goTo]
  );

  const handleNewPronunciationRecord = useCallback(
    (score: number) => {
      const Icon = getBadge('pr-pronunciation').icon;
      showCelebration({
        eyebrow: t('celebration.pronunciation.eyebrow'),
        title: t('celebration.pronunciation.title'),
        subtitle: t('celebration.pronunciation.subtitle', { score: Math.round(score) }),
        centerIcon: <Icon size={56} strokeWidth={1.8} />,
        colorTheme: 'gold',
        primaryLabel: t('celebration.viewAchievementsCta'),
        onPrimary: () => goTo('/dashboard/achievements'),
      });
    },
    [showCelebration, t, goTo]
  );

  const handleStageCompleted = useCallback(
    (level: number) => {
      showCelebration({
        eyebrow: t('celebration.stageComplete.eyebrow'),
        title: t('celebration.stageComplete.title'),
        subtitle: t('celebration.stageComplete.subtitle'),
        percent: adoptedRoadmap ? Math.round(((level - 1) / adoptedRoadmap.stages.length) * 100) : undefined,
        colorTheme: 'purple',
        primaryLabel: t('celebration.goToRoadmapCta'),
        onPrimary: () => goTo('/dashboard/roadmap'),
      });
    },
    [showCelebration, t, goTo, adoptedRoadmap]
  );

  const handleRoadmapCompleted = useCallback(() => {
    showCelebration({
      eyebrow: t('celebration.roadmapComplete.eyebrow'),
      title: t('celebration.roadmapComplete.title'),
      subtitle: t('celebration.roadmapComplete.subtitle'),
      percent: 100,
      colorTheme: 'purple',
      primaryLabel: t('celebration.viewAchievementsCta'),
      onPrimary: () => goTo('/dashboard/achievements'),
    });
  }, [showCelebration, t, goTo]);

  const handleFirstWordSaved = useCallback(() => {
    const Icon = getBadge('pr-saved-words').icon;
    showCelebration({
      eyebrow: t('celebration.savedWords.eyebrow'),
      title: t('celebration.savedWords.title'),
      subtitle: t('celebration.savedWords.subtitle', { count: 1 }),
      centerIcon: <Icon size={56} strokeWidth={1.8} />,
      colorTheme: 'gold',
      primaryLabel: t('celebration.viewAchievementsCta'),
      onPrimary: () => goTo('/dashboard/achievements'),
    });
  }, [showCelebration, t, goTo]);

  useMilestoneDetector(
    userId ? 'achv_lastSeenStreak' : null,
    settings,
    STREAK_MILESTONES,
    currentStreak,
    handleStreakMilestone
  );
  useMilestoneDetector(
    userId ? 'achv_lastSeenRecordsCount' : null,
    settings,
    RECORDS_MILESTONES,
    stats.totalSessionCount,
    handleRecordsMilestone
  );
  useMilestoneDetector(
    userId ? 'achv_lastSeenStudyHours' : null,
    settings,
    HOURS_MILESTONES,
    Math.floor(stats.totalStudyMinutes / 60),
    handleHoursMilestone
  );
  useNewRecordDetector(
    userId ? 'achv_bestLongestSession' : null,
    settings,
    stats.longestSessionMinutes,
    handleNewLongestSession
  );
  useNewRecordDetector(
    userId ? 'achv_bestPronunciation' : null,
    settings,
    stats.bestPronunciationScore,
    handleNewPronunciationRecord
  );
  // Stage completion is "new record" semantics too - currentStageLevel only ever increases as stages complete.
  useNewRecordDetector(
    adoptedRoadmap ? `achv_currentStageLevel_${adoptedRoadmap.id}` : null,
    settings,
    stats.currentStageLevel,
    handleStageCompleted
  );
  useOneTimeUnlockDetector(
    adoptedRoadmap ? `achv_roadmapComplete_${adoptedRoadmap.id}` : null,
    settings,
    stats.currentStageLevel !== null && stats.totalStages !== null && stats.currentStageLevel >= stats.totalStages,
    handleRoadmapCompleted
  );
  useOneTimeUnlockDetector(
    userId ? 'achv_savedWordsUnlocked' : null,
    settings,
    stats.savedVocabWordCount > 0,
    handleFirstWordSaved
  );
}
