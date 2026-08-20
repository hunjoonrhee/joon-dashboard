'use client';

import { FileText, Home, Trophy } from 'lucide-react';
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
      <div className="bg-surf border border-border rounded-2xl p-6 max-w-sm w-full shadow-sm">
        <div className="bg-surf-2 border border-border rounded-xl p-4 mb-4 flex items-start gap-3">
          <Trophy size={20} className="text-pri flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-ink">{t('sessionComplete')}</p>
            <p className="text-xs text-ink-dim mt-0.5">
              {t('sessionSummary', { duration: savedRecord?.duration ?? 0 })}
            </p>
          </div>
        </div>

        {savedRecord && (
          <>
            <p className="text-xs font-semibold text-ink-dim mb-2 flex items-center gap-1">
              <FileText size={12} /> {t('autoRecord')}
            </p>
            <div className="bg-surf-2 border border-border rounded-xl p-3 mb-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-ink-faint">{t('recordTitle')}</span>
                <span className="text-xs font-medium text-ink text-right max-w-[60%]">{savedRecord.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-faint">{t('recordDate')}</span>
                <span className="text-xs font-medium text-ink">{savedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-faint">{t('recordDuration')}</span>
                <span className="text-xs font-medium text-ink">{t('minutes', { n: savedRecord.duration })}</span>
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-xs text-ink-faint mb-1">{t('recordTags')}</p>
                <div className="flex flex-wrap gap-1">
                  {savedRecord.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-surf text-pri rounded-full">
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
            className="flex-1 py-2 rounded-xl bg-pri text-on-pri text-xs font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Home size={13} />
            {t('goHome')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/dashboard/study`)}
            className="px-3 py-2 rounded-xl border border-border text-xs text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('editRecord')}
          </button>
        </div>
      </div>
    </main>
  );
}
