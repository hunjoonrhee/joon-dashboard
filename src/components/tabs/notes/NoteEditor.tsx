'use client';

import type { Note } from '@/types';
import { Pencil, PenLine, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

const moods = ['🎯', '🤔', '💪', '😴', '🔥', '😊', '😤'];

interface EditorProps {
  title: string;
  content: string;
  mood: string | null;
  saving: boolean;
  isNew: boolean;
  selectedNote: Note | null;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onMoodChange: (v: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function NoteEditorPanel({
  title,
  content,
  mood,
  saving,
  isNew,
  onTitleChange,
  onContentChange,
  onMoodChange,
  onSave,
  onCancel,
  onDelete,
}: EditorProps) {
  const t = useTranslations('notes');
  const tCommon = useTranslations('common');

  return (
    <div className="bg-surf rounded-xl border border-border overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-border">
        <div className="flex gap-2 mb-3">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => onMoodChange(mood === m ? null : m)}
              className={`text-lg transition-all ${mood === m ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-70'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="w-full text-lg font-bold text-ink outline-none placeholder:text-ink-faint bg-surf"
          placeholder={t('editorPlaceholder')}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <textarea
        autoFocus
        className="flex-1 w-full p-4 text-sm text-ink-dim outline-none resize-none placeholder:text-ink-faint leading-relaxed min-h-[350px] bg-surf"
        placeholder={t('bodyPlaceholder')}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isNew && onDelete && (
            <button onClick={onDelete} className="text-ink-faint hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onCancel} className="text-xs text-ink-faint hover:text-ink-dim transition-colors">
            {tCommon('cancel')}
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  );
}

interface ViewProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

export function NoteViewPanel({ note, onEdit, onDelete }: ViewProps) {
  const t = useTranslations('notes');
  const locale = useLocale();

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="bg-surf rounded-xl border border-border overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {note.mood && <span className="text-lg">{note.mood}</span>}
            <h2 className="text-lg font-bold text-ink">{note.title || t('untitled')}</h2>
          </div>
          <p className="text-xs text-ink-faint">
            {dateLabel(note.updated_at)} {t('edited')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-ink-faint hover:text-pri transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="text-ink-faint hover:text-red-400 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 prose prose-sm max-w-none text-ink-dim">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
  );
}

export function NoteEmptyPanel({ onNew }: { onNew: () => void }) {
  const t = useTranslations('notes');
  return (
    <div
      className="bg-surf rounded-xl border border-dashed border-border flex items-center justify-center min-h-[500px] cursor-pointer hover:border-pri/40 transition-colors"
      onClick={onNew}
    >
      <div className="text-center">
        <PenLine size={28} strokeWidth={1.8} className="text-ink-faint mx-auto mb-2" />
        <p className="text-sm text-ink-faint whitespace-pre-line">{t('selectOrNew')}</p>
      </div>
    </div>
  );
}
