'use client';

import type { Note } from '@/types';
import { PenLine } from 'lucide-react';
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
    <div className="bg-surf rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">{t('recentNotes')}</p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/notes`)}
          className="text-xs text-pri font-medium hover:opacity-80"
        >
          {t('viewAll')}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <PenLine size={24} strokeWidth={1.8} className="text-ink-faint" />
          <p className="text-sm font-semibold text-ink">{t('notesEmpty')}</p>
          <p className="text-xs text-ink-faint leading-relaxed">{t('notesEmptySub')}</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard/notes`)}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-pri bg-surf-2 border border-border hover:bg-border transition-colors"
          >
            {t('firstNote')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {notes.map((note) => (
            <div
              key={note.id}
              className="py-2.5 cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/notes`)}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.mood && <span className="text-sm">{note.mood}</span>}
                <p className="text-sm font-semibold text-ink truncate">{note.title || t('untitled')}</p>
              </div>
              <p className="text-xs text-ink-dim line-clamp-2 leading-relaxed">{note.content}</p>
              <p className="text-xs text-ink-faint mt-1">{dateLabel(note.updated_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
