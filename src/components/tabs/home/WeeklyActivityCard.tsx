'use client';

import { Check, Flame, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WeekDay {
  label: string;
  hasSession: boolean;
  isToday: boolean;
}

interface WeeklyStats {
  hours: number;
  tilCount: number;
}

interface Props {
  streak: number;
  maxStreak: number;
  week: WeekDay[];
  weeklyStats: WeeklyStats;
  completedTopicsCount: number;
}

export default function WeeklyActivityCard({ streak, maxStreak, week, weeklyStats, completedTopicsCount }: Props) {
  const t = useTranslations('home');

  return (
    <div className="bg-surf rounded-xl border border-border p-4">
      <p className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-3">{t('activity')}</p>

      {streak > 0 ? (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-surf-2 border border-border">
          <Flame size={24} strokeWidth={1.8} className="text-amber" />
          <div className="flex-1">
            <div className="text-lg font-bold text-ink">
              {streak}
              {t('streakDays')}
            </div>
            <div className="text-xs font-medium text-ink-dim">{t('streakActive')}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-faint">{t('streakBest')}</div>
            <div className="text-base font-bold text-ink">
              {maxStreak}
              {t('streakDays')}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-surf-2 border border-border">
          <Moon size={20} strokeWidth={1.8} className="text-ink-faint" />
          <div>
            <div className="text-sm font-medium text-ink-dim">{t('streakNone')}</div>
            <div className="text-xs text-ink-faint">{t('streakStart')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surf-2 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-ink">{weeklyStats.hours}h</div>
          <div className="text-xs text-ink-faint mt-0.5">{t('weeklyHours')}</div>
        </div>
        <div className="bg-surf-2 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-ink">{weeklyStats.tilCount}</div>
          <div className="text-xs text-ink-faint mt-0.5">{t('weeklyTil')}</div>
        </div>
        <div className="bg-surf-2 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-ink">{completedTopicsCount}</div>
          <div className="text-xs text-ink-faint mt-0.5">{t('weeklyTopics')}</div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {week.map(({ label, hasSession, isToday }) => (
          <div
            key={label}
            className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium gap-0.5 ${
              isToday
                ? 'bg-pri text-on-pri'
                : hasSession
                  ? 'bg-surf-2 text-amber border border-border'
                  : 'bg-surf-2 text-ink-faint border border-border'
            }`}
          >
            <span>{label}</span>
            {hasSession && !isToday && <Check size={9} strokeWidth={3} />}
          </div>
        ))}
      </div>
    </div>
  );
}
