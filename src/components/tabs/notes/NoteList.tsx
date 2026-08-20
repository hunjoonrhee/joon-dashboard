'use client';

import type { Note } from '@/types';
import { PenLine } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onNew: () => void;
}

export default function NoteList({ notes, selectedId, onSelect, onNew }: Props) {
  const t = useTranslations('notes');
  const locale = useLocale();

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="bg-surf rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-ink-faint uppercase tracking-wider flex items-center gap-1">
          <PenLine size={12} /> {t('title')}
        </p>
        <button onClick={onNew} className="text-xs text-pri font-bold hover:opacity-80 transition-colors">
          {t('newNote')}
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <PenLine size={28} strokeWidth={1.8} className="text-ink-faint" />
          <p className="text-sm font-medium text-ink-dim">{t('empty')}</p>
          <p className="text-xs text-ink-faint leading-relaxed whitespace-pre-line">{t('emptySub')}</p>
          <button
            onClick={onNew}
            className="mt-2 px-4 py-2 rounded-lg bg-pri text-on-pri text-xs font-bold hover:opacity-90 transition-colors"
          >
            {t('firstNote')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelect(note)}
              className={`py-3 cursor-pointer transition-colors rounded-lg px-2 -mx-2 ${selectedId === note.id ? 'bg-pri/10' : 'hover:bg-surf-2'}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.mood && <span className="text-sm">{note.mood}</span>}
                <p className="text-sm font-semibold text-ink truncate flex-1">{note.title || t('untitled')}</p>
              </div>
              <p className="text-xs text-ink-faint line-clamp-2 leading-relaxed">{note.content}</p>
              <p className="text-xs text-ink-faint mt-1">{dateLabel(note.updated_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
