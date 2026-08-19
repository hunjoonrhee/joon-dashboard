'use client';

import AchievementSection from '@/components/achievements/AchievementSection';
import { getBadgeCelebrationContent } from '@/components/achievements/badge-celebration-content';
import { BADGES } from '@/components/achievements/badge-registry';
import { useAdoptedRoadmap } from '@/components/tabs/home/hooks/useAdoptedRoadmap';
import { computeAchievementStats, computeUnlockedBadges } from '@/lib/achievements';
import { useCelebration } from '@/lib/celebration-context';
import { useGoals, useSessions, useSettings } from '@/lib/queries';
import type { BadgeId } from '@/lib/achievements';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AchievementsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('achievements');
  const showCelebration = useCelebration();

  const { data: sessions = [] } = useSessions();
  const { data: goals = [] } = useGoals();
  const { data: settings = {} } = useSettings();
  const { adoptedRoadmap } = useAdoptedRoadmap(settings);

  const stats = computeAchievementStats(sessions, goals, adoptedRoadmap);
  const unlocked = computeUnlockedBadges(stats);
  const unlockedCount = BADGES.filter((b) => unlocked[b.id]).length;

  const handleBadgeClick = (id: BadgeId) => {
    const content = getBadgeCelebrationContent(id, stats, t);
    if (!content) return;
    showCelebration({
      ...content,
      primaryLabel: t('celebration.previewCloseCta'),
      onPrimary: () => {},
    });
  };

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="flex items-center gap-1.5 text-ink-dim hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{t('back')}</span>
      </button>

      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-lg font-bold text-ink">{t('title')}</h1>
        <p className="text-sm text-ink-dim">{t('unlockedCount', { unlocked: unlockedCount, total: BADGES.length })}</p>
      </div>

      <AchievementSection
        section="milestone"
        title={t('sectionMilestone')}
        unlocked={unlocked}
        stats={stats}
        onBadgeClick={handleBadgeClick}
      />
      <AchievementSection
        section="personalRecord"
        title={t('sectionPersonalRecord')}
        unlocked={unlocked}
        stats={stats}
        onBadgeClick={handleBadgeClick}
      />
      <AchievementSection
        section="goal"
        title={t('sectionGoal')}
        unlocked={unlocked}
        stats={stats}
        onBadgeClick={handleBadgeClick}
      />
    </main>
  );
}
