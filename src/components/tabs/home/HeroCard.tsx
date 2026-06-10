'use client'

import type { Goal, Session, Topic } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  settings: Record<string, string>
  overallPct: number
  streak: number
  monthCount: number
  completedTopicsCount: number
}

export default function HeroCard({
  settings,
  overallPct,
  streak,
  monthCount,
  completedTopicsCount,
}: Props) {
  const t = useTranslations('home')

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
        <div className="h-full bg-white rounded-full" style={{ width: `${overallPct}%` }} />
      </div>
      <div className="flex gap-6 mt-3">
        <div>
          <div className="text-base font-bold">{overallPct}%</div>
          <div className="text-xs opacity-65">{t('progressLabel')}</div>
        </div>
        <div>
          <div className="text-base font-bold">{streak > 0 ? `${streak}일 🔥` : '-'}</div>
          <div className="text-xs opacity-65">{t('currentStreak')}</div>
        </div>
        <div>
          <div className="text-base font-bold">{monthCount}{t('countUnit')}</div>
          <div className="text-xs opacity-65">{t('monthlySession')}</div>
        </div>
        <div>
          <div className="text-base font-bold">{completedTopicsCount}개</div>
          <div className="text-xs opacity-65">{t('completedTopics')}</div>
        </div>
      </div>
    </div>
  )
}
