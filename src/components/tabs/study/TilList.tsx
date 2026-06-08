'use client'

import { getTagColor } from '@/lib/tagColor'
import type { Session } from '@/types'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  sessions: Session[]
}

export default function TilList({ sessions }: Props) {
  const router = useRouter()
  const locale = useLocale()

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US'
    )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        TIL 모음 — 지식 자산
      </p>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400">
          아직 TIL이 없어. 공부 기록 추가할 때 TIL도 같이 써봐.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="py-3 cursor-pointer"
              onClick={() => router.push(`sessions/${s.id}`)}
            >
              <p className="text-xs text-gray-400 mb-1">{dateLabel(s.date)}</p>
              <p className="text-sm font-medium text-gray-800 mb-1">
                {s.title}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2">{s.til}</p>
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
