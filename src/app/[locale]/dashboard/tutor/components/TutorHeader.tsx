'use client';

import { useGuardedAction } from '@/hooks/useGuardedNavigate';
import { ArrowLeft, BookMarked, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface Props {
  topic: string;
  elapsedMin: number;
  isEndingSession: boolean;
  loading: boolean;
  onEndSession: () => void;
}

export default function TutorHeader({ topic, elapsedMin, isEndingSession, loading, onEndSession }: Props) {
  const t = useTranslations('tutor');
  const locale = useLocale();
  const router = useRouter();
  const guard = useGuardedAction();

  return (
    <div className="bg-surf border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <button onClick={() => guard(() => router.back())} className="text-ink-faint hover:text-ink mr-1">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-bold text-ink">{topic ? t('sessionWith', { topic }) : t('pageTitle')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => guard(() => router.push(`/${locale}/dashboard/vocab`))}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-faint hover:text-pri hover:bg-surf-2 transition-colors"
          title={t('vocabLink')}
        >
          <BookMarked size={16} />
        </button>
        <span className="flex items-center gap-1 text-xs text-pri bg-surf-2 px-2 py-1 rounded-full font-medium">
          <Clock size={11} />
          {t('minutes', { n: elapsedMin })}
        </span>
        <button
          onClick={onEndSession}
          disabled={isEndingSession || loading}
          className="text-xs text-ink-dim border border-border px-3 py-1.5 rounded-lg hover:bg-surf-2 disabled:opacity-40 transition-colors"
        >
          {isEndingSession ? t('summarizing') : t('endSession')}
        </button>
      </div>
    </div>
  );
}
