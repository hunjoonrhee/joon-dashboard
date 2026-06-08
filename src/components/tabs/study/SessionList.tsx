'use client'

import { getTagColor } from '@/lib/tagColor'
import type { Session } from '@/types'
import { Pencil, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  sessions: Session[]
  grouped: Record<string, Session[]>
  onAdd: () => void
  onEdit: (s: Session) => void
}

export default function SessionList({
  sessions,
  grouped,
  onAdd,
  onEdit,
}: Props) {
  const router = useRouter()
  const t = useTranslations('study')
  const locale = useLocale()

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US'
    )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {t('title')}
        </p>
        <button
          onClick={onAdd}
          className="text-indigo-500 hover:text-indigo-700 transition-colors lg:hidden"
        >
          <Plus size={18} />
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400">{t('empty')}</p>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider my-2">
              {month}
            </p>
            <div className="flex flex-col divide-y divide-gray-50">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between py-2.5"
                >
                  <div
                    className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`sessions/${s.id}`)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 hover:text-indigo-500 transition-colors truncate">
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {dateLabel(s.date)}
                        {s.duration_minutes && ` · ${s.duration_minutes}분`}
                      </p>
                      {s.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
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
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    {s.til && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">
                        TIL
                      </span>
                    )}
                    <button
                      onClick={() => onEdit(s)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
