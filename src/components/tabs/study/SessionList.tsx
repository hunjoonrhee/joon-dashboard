'use client';

import { getTagColor } from '@/lib/tagColor';
import type { Session } from '@/types';
import { BookOpen, Pencil, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Props {
  sessions: Session[];
  grouped: Record<string, Session[]>;
  onAdd: () => void;
  onEdit: (s: Session) => void;
}

function TilBadge({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const locale = useLocale();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/${locale}/dashboard/til/${sessionId}`);
      }}
      className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium hover:bg-green-100 transition-colors"
    >
      TIL
    </button>
  );
}

export default function SessionList({ sessions, grouped, onAdd, onEdit }: Props) {
  const t = useTranslations('study');
  const router = useRouter();
  const locale = useLocale();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <BookOpen size={28} strokeWidth={1.8} className="text-ink-faint" />
        <p className="text-sm font-semibold text-ink-dim">{t('emptyTitle')}</p>
        <p className="text-xs text-ink-faint">{t('emptyDesc')}</p>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-pri text-on-pri text-xs font-semibold hover:opacity-90 transition-colors"
        >
          + {t('addFirst')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surf rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <p className="text-xs font-bold text-ink-faint uppercase tracking-wider">{t('sessionListTitle')}</p>
        <button onClick={onAdd} className="text-pri hover:opacity-80 transition-colors">
          <Plus size={16} />
        </button>
      </div>
      {Object.entries(grouped).map(([month, monthSessions]) => (
        <div key={month}>
          <div className="px-4 py-1.5 bg-surf-2 border-b border-border">
            <p className="text-xs text-ink-faint font-medium">{month}</p>
          </div>
          {monthSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surf-2 transition-colors cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/sessions/${s.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{s.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-ink-faint">{s.date}</span>
                  {s.duration_minutes && <span className="text-xs text-ink-faint">· {s.duration_minutes}분</span>}
                  {s.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${getTagColor(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {s.til && <TilBadge sessionId={s.id} />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(s);
                  }}
                  className="text-ink-faint hover:text-pri transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
