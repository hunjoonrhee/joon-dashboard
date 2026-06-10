'use client'

import { useTranslations } from 'next-intl'

interface WeekDay {
  label: string
  hasSession: boolean
  isToday: boolean
}

interface WeeklyStats {
  hours: number
  tilCount: number
}

interface Props {
  streak: number
  maxStreak: number
  week: WeekDay[]
  weeklyStats: WeeklyStats
  completedTopicsCount: number
}

export default function WeeklyActivityCard({
  streak,
  maxStreak,
  week,
  weeklyStats,
  completedTopicsCount,
}: Props) {
  const t = useTranslations('home')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        {t('activity')}
      </p>

      {streak > 0 ? (
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-3"
          style={{
            background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.08))',
            border: '1px solid rgba(249,115,22,0.2)',
          }}
        >
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <div className="text-lg font-bold" style={{ color: '#ea580c' }}>
              {streak}{t('streakDays')}
            </div>
            <div className="text-xs font-medium" style={{ color: '#9a3412' }}>
              {t('streakActive')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">최고 기록</div>
            <div className="text-base font-bold" style={{ color: '#ea580c' }}>
              {maxStreak}{t('streakDays')}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-gray-50 border border-gray-100">
          <span className="text-xl">💤</span>
          <div>
            <div className="text-sm font-medium text-gray-500">{t('streakNone')}</div>
            <div className="text-xs text-gray-400">{t('streakStart')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{weeklyStats.hours}h</div>
          <div className="text-xs text-gray-400 mt-0.5">{t('weeklyHours')}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{weeklyStats.tilCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">{t('weeklyTil')}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-2 text-center">
          <div className="text-base font-bold text-gray-800">{completedTopicsCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">{t('weeklyTopics')}</div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {week.map(({ label, hasSession, isToday }) => (
          <div
            key={label}
            className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium gap-0.5 ${
              isToday
                ? 'bg-indigo-500 text-white'
                : hasSession
                  ? 'text-orange-700 border border-orange-200'
                  : 'bg-gray-50 text-gray-400 border border-gray-100'
            }`}
            style={
              hasSession && !isToday
                ? { background: 'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(245,158,11,0.08))' }
                : {}
            }
          >
            <span>{label}</span>
            {hasSession && !isToday && <span style={{ fontSize: '7px' }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
