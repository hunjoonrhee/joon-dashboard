'use client'

import type { AiRoadmap } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  settings: Record<string, string>
  overallPct: number
  streak: number
  monthCount: number
  completedTopicsCount: number
  adoptedRoadmap: AiRoadmap | null
  gapPct: number | null
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
  const t = useTranslations('home')

  const gapColor =
    gapPct === null
      ? 'bg-white/30'
      : gapPct >= 70
        ? 'bg-emerald-300'
        : gapPct >= 40
          ? 'bg-amber-300'
          : 'bg-rose-300'

  const gapTextColor =
    gapPct === null
      ? 'opacity-60'
      : gapPct >= 70
        ? 'text-emerald-100'
        : gapPct >= 40
          ? 'text-amber-100'
          : 'text-rose-100'

  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/10" />

      <p className="text-xs font-bold tracking-widest opacity-70 uppercase mb-1">
        {t('location')}
      </p>
      <p className="text-2xl font-bold tracking-tight mb-0.5">
        {settings.big_goal ?? '리드 아키텍트'}
      </p>
      <p className="text-xs opacity-70 mb-4">
        {settings.big_goal_sub ?? '시니어 → 리드 → 아키텍트'}
      </p>

      <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      <div className="flex gap-6 mt-3">
        <div>
          <div className="text-base font-bold">{overallPct}%</div>
          <div className="text-xs opacity-65">{t('progressLabel')}</div>
        </div>
        <div>
          <div className="text-base font-bold">
            {streak > 0 ? `${streak}일 🔥` : '-'}
          </div>
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
              <span className="opacity-60">
                {' '}
                · {adoptedRoadmap.career_level}
              </span>
            </p>
            {gapPct !== null && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${gapColor}`}
                    style={{ width: `${gapPct}%` }}
                  />
                </div>
                <span className={`text-xs font-bold shrink-0 ${gapTextColor}`}>
                  {t('gapLabel')} {gapPct}%
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs opacity-50 italic">{t('noRoadmap')}</p>
        )}
      </div>
    </div>
  )
}
