'use client';

import type { Note } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Props {
  notes: Note[];
}

export default function NotesPreviewCard({ notes }: Props) {
  const t = useTranslations('home');
  const router = useRouter();
  const locale = useLocale();

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('recentNotes')}</p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/notes`)}
          className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
        >
          {t('viewAll')}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-2xl opacity-40">🔥</span>
          <p className="text-sm font-semibold text-gray-700">{t('notesEmpty')}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{t('notesEmptySub')}</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard/notes`)}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
          >
            {t('firstNote')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {notes.map((note) => (
            <div
              key={note.id}
              className="py-2.5 cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/notes`)}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.mood && <span className="text-sm">{note.mood}</span>}
                <p className="text-sm font-semibold text-gray-800 truncate">{note.title || t('untitled')}</p>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{note.content}</p>
              <p className="text-xs text-gray-300 mt-1">{dateLabel(note.updated_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
