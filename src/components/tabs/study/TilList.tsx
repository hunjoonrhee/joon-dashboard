'use client'

import { getTagColor } from '@/lib/tagColor'
import type { Session } from '@/types'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  sessions: Session[]
  onAdd: () => void
}

export default function TilList({ sessions, onAdd }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('study')

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US'
    )

  const tilSessions = sessions.filter((s) => s.til)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          💡 TIL 모음 — 지식 자산
        </p>
        <span className="text-xs text-gray-400">{tilSessions.length}개</span>
      </div>
      {tilSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl opacity-30">💡</span>
          <p className="text-sm font-semibold text-gray-700">{t('tilEmpty')}</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('tilEmptySub')}
          </p>
          <button
            onClick={onAdd}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            {t('addModal')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {tilSessions.map((s) => (
            <div
              key={s.id}
              className="py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => router.push(`sessions/${s.id}`)}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">{dateLabel(s.date)}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">
                  TIL
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1 truncate">
                {s.title}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {s.til}
              </p>
              {s.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
