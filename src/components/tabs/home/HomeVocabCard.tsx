'use client';

import { useDueVocabWords, useVocabWordCount } from '@/lib/queries';
import { BookMarked } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function HomeVocabCard() {
  const t = useTranslations('home');
  const tVocab = useTranslations('vocab');
  const router = useRouter();
  const locale = useLocale();

  const { data: wordCount = 0 } = useVocabWordCount();
  const { data: dueWords = [] } = useDueVocabWords();

  return (
    <div className="bg-surf border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BookMarked size={16} strokeWidth={1.8} className="text-pri" />
        <p className="text-xs font-bold text-ink uppercase tracking-wider">{tVocab('title')}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3">
        <p className="text-2xl font-bold text-ink">{wordCount}</p>
        <p className="text-xs text-ink-faint">{t('vocabSavedCount')}</p>
        {dueWords.length > 0 && (
          <p className="text-xs text-pri font-medium mt-1">{t('vocabDueCount', { count: dueWords.length })}</p>
        )}
      </div>

      <button
        onClick={() => router.push(`/${locale}/dashboard/vocab`)}
        className="px-3 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 transition-colors self-center"
      >
        {dueWords.length > 0 ? tVocab('tabReview') : tVocab('title')}
      </button>
    </div>
  );
}
