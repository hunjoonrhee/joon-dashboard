'use client'

import type { Note } from '@/types'
import { useLocale, useTranslations } from 'next-intl'

interface Props {
  notes: Note[]
  selectedId: string | null
  onSelect: (note: Note) => void
  onNew: () => void
}

export default function NoteList({
  notes,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const t = useTranslations('notes')
  const locale = useLocale()

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
      { month: 'long', day: 'numeric' }
    )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          ✍️ {t('title')}
        </p>
        <button
          onClick={onNew}
          className="text-xs text-indigo-500 font-bold hover:text-indigo-700 transition-colors"
        >
          {t('newNote')}
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="text-3xl">✍️</div>
          <p className="text-sm font-medium text-gray-600">{t('empty')}</p>
          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
            {t('emptySub')}
          </p>
          <button
            onClick={onNew}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
          >
            {t('firstNote')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelect(note)}
              className={`py-3 cursor-pointer transition-colors rounded-lg px-2 -mx-2 ${selectedId === note.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.mood && <span className="text-sm">{note.mood}</span>}
                <p className="text-sm font-semibold text-gray-800 truncate flex-1">
                  {note.title || t('untitled')}
                </p>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {note.content}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {dateLabel(note.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
