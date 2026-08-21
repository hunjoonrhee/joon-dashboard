'use client';

import type { AchievementStats, BadgeId } from '@/lib/achievements';
import { useTranslations } from 'next-intl';
import AchievementBadge from './AchievementBadge';
import { BADGES, type BadgeSection } from './badge-registry';

interface Props {
  section: BadgeSection;
  title: string;
  unlocked: Record<BadgeId, boolean>;
  stats: AchievementStats;
  onBadgeClick: (id: BadgeId) => void;
}

export default function AchievementSection({ section, title, unlocked, stats, onBadgeClick }: Props) {
  const t = useTranslations('achievements');
  const badges = BADGES.filter((b) => b.section === section);

  const detailFor = (id: BadgeId): string | undefined => {
    if (id === 'pr-longest-session' && stats.longestSessionMinutes !== null) {
      return t('detail.longestSession', { minutes: stats.longestSessionMinutes });
    }
    if (id === 'pr-pronunciation' && stats.bestPronunciationScore !== null) {
      return t('detail.pronunciation', { score: Math.round(stats.bestPronunciationScore) });
    }
    return undefined;
  };

  return (
    <div className="mb-8">
      <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-4">{title}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-5">
        {badges.map((badge) => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            unlocked={unlocked[badge.id]}
            label={t(`badges.${badge.labelKey}`)}
            detail={detailFor(badge.id)}
            onClick={() => onBadgeClick(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}
