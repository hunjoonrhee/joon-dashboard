'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { SavedRecord } from '../hooks/useTutorSession';

interface Props {
  savedRecord: SavedRecord | null;
}

export default function TutorComplete({ savedRecord }: Props) {
  const t = useTranslations('tutor');
  const locale = useLocale();
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-sm">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 flex items-start gap-3">
          <span className="text-xl">🏆</span>
          <div>
            <p className="text-sm font-bold text-emerald-800">{t('sessionComplete')}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {t('sessionSummary', { duration: savedRecord?.duration ?? 0 })}
            </p>
          </div>
        </div>

        {savedRecord && (
          <>
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">📝 {t('autoRecord')}</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">{t('recordTitle')}</span>
                <span className="text-xs font-medium text-gray-700 text-right max-w-[60%]">{savedRecord.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">{t('recordDate')}</span>
                <span className="text-xs font-medium text-gray-700">{savedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">{t('recordDuration')}</span>
                <span className="text-xs font-medium text-gray-700">{t('minutes', { n: savedRecord.duration })}</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400 mb-1">{t('recordTags')}</p>
                <div className="flex flex-wrap gap-1">
                  {savedRecord.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
          >
            🏠 {t('goHome')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/dashboard/study`)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t('editRecord')}
          </button>
        </div>
      </div>
    </main>
  );
}
