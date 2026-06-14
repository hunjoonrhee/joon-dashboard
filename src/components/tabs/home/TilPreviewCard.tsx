'use client';

import type { Session } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Props {
  sessions: Session[];
  onAddStudy: () => void;
}

export default function TilPreviewCard({ sessions, onAddStudy }: Props) {
  const t = useTranslations('home');
  const router = useRouter();
  const locale = useLocale();

  const tilSessions = sessions.filter((s) => s.til).slice(0, 2);

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
      { month: 'short', day: 'numeric' }
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {t('recentTil')}
        </p>
        <button
          onClick={() => router.push(`/${locale}/dashboard/study`)}
          className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
        >
          {t('viewAll')}
        </button>
      </div>

      {tilSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-2xl opacity-40">💡</span>
          <p className="text-sm font-semibold text-gray-700">{t('tilEmpty')}</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('tilEmptySub')}
          </p>
          <button
            onClick={onAddStudy}
            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            {t('addStudy')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {tilSessions.map((s) => (
            <div
              key={s.id}
              className="py-2.5 cursor-pointer"
              onClick={() =>
                router.push(`/${locale}/dashboard/sessions/${s.id}`)
              }
            >
              <p className="text-xs text-gray-400 mb-1">{dateLabel(s.date)}</p>
              <p className="text-sm font-semibold text-gray-800 mb-1 truncate">
                {s.title}
              </p>
              <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                {s.til}
              </p>
              {s.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {s.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600"
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
  );
}
