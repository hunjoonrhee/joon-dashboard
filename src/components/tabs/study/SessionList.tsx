'use client';

import { getTagColor } from '@/lib/tagColor';
import type { Session } from '@/types';
import { Pencil, Plus } from 'lucide-react';
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
        <span className="text-3xl opacity-30">📖</span>
        <p className="text-sm font-semibold text-gray-700">{t('emptyTitle')}</p>
        <p className="text-xs text-gray-400">{t('emptyDesc')}</p>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
        >
          + {t('addFirst')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sessionListTitle')}</p>
        <button onClick={onAdd} className="text-indigo-500 hover:text-indigo-700 transition-colors">
          <Plus size={16} />
        </button>
      </div>
      {Object.entries(grouped).map(([month, monthSessions]) => (
        <div key={month}>
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">{month}</p>
          </div>
          {monthSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/sessions/${s.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{s.date}</span>
                  {s.duration_minutes && <span className="text-xs text-gray-400">· {s.duration_minutes}분</span>}
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
                  className="text-gray-400 hover:text-indigo-500 transition-colors"
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
