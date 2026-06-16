'use client';

import { useTranslations } from 'next-intl';
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
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm mr-1">
          ←
        </button>
        <span className="text-sm font-bold text-gray-800">
          {topic ? t('sessionWith', { topic }) : t('pageTitle')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full font-medium">
          🕐 {t('minutes', { n: elapsedMin })}
        </span>
        <button
          onClick={onEndSession}
          disabled={isEndingSession || loading}
          className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {isEndingSession ? '요약 중...' : t('endSession')}
        </button>
      </div>
    </div>
  );
}
