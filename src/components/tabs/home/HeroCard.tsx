'use client';

import { CompassDial } from '@/components/compass-dial';
import type { AiRoadmap } from '@/types';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  settings: Record<string, string>;
  overallPct: number;
  streak: number;
  monthCount: number;
  completedTopicsCount: number;
  adoptedRoadmap: AiRoadmap | null;
  gapPct: number | null;
}

export default function HeroCard({
  settings,
  overallPct,
  streak,
  monthCount,
  completedTopicsCount,
  adoptedRoadmap,
  gapPct,
}: Props) {
  const t = useTranslations('home');

  const gapColor =
    gapPct === null ? undefined : gapPct >= 70 ? 'var(--color-ok)' : gapPct >= 40 ? 'var(--color-amber)' : '#e26a5c';

  return (
    <div className="lg:col-span-2 bg-pri rounded-2xl p-5 text-on-pri relative overflow-hidden">
      <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/10" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest opacity-70 uppercase mb-1">{t('location')}</p>
          <p className="text-2xl font-bold tracking-tight mb-0.5">{settings.big_goal ?? '리드 아키텍트'}</p>
          <p className="text-xs opacity-70">{settings.big_goal_sub ?? '시니어 → 리드 → 아키텍트'}</p>
        </div>
        <CompassDial
          percent={overallPct}
          size={76}
          label={t('progressLabel')}
          colorFrom="var(--color-on-pri)"
          colorTo="var(--color-on-pri)"
          tickActiveColor="var(--color-on-pri)"
          tickInactiveColor="rgba(255,255,255,0.25)"
          trackColor="rgba(255,255,255,0.18)"
          markerFill="var(--color-pri)"
          textColor="var(--color-on-pri)"
          subLabelColor="rgba(255,255,255,0.65)"
          className="flex-shrink-0"
        />
      </div>

      <div className="flex gap-6 mt-4">
        <div>
          <div className="text-base font-bold">{streak > 0 ? `${streak}일` : '-'}</div>
          <div className="text-xs opacity-65">{t('currentStreak')}</div>
        </div>
        <div>
          <div className="text-base font-bold">
            {monthCount}
            {t('countUnit')}
          </div>
          <div className="text-xs opacity-65">{t('monthlySession')}</div>
        </div>
        <div>
          <div className="text-base font-bold">{completedTopicsCount}개</div>
          <div className="text-xs opacity-65">{t('completedTopics')}</div>
        </div>
      </div>

      {/* 채택된 로드맵 배너 */}
      <div className="mt-4 pt-3.5 border-t border-white/20">
        {adoptedRoadmap ? (
          <>
            <p className="text-xs mb-2">
              <span className="font-semibold">{adoptedRoadmap.goal}</span>
              <span className="opacity-60"> · {adoptedRoadmap.career_level}</span>
            </p>
            {gapPct !== null && (
              <div className="flex items-center gap-3">
                <CompassDial
                  percent={gapPct}
                  size={44}
                  showLabel={false}
                  colorFrom={gapColor}
                  colorTo={gapColor}
                  tickActiveColor={gapColor}
                  tickInactiveColor="rgba(255,255,255,0.2)"
                  trackColor="rgba(255,255,255,0.15)"
                  markerFill="var(--color-pri)"
                />
                <span className="text-xs font-bold shrink-0 opacity-90 flex items-center gap-1">
                  {t('gapLabel')} {gapPct}%
                  <span title={t('gapTooltip')} className="cursor-help">
                    <Info size={12} className="opacity-60" />
                  </span>
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs opacity-50 italic">{t('noRoadmap')}</p>
        )}
      </div>
    </div>
  );
}
