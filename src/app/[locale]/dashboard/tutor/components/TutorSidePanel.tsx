'use client';

import { useTranslations } from 'next-intl';
import type { Message, SummaryData } from '../hooks/useTutorSession';
import type { UserContext } from '../hooks/useUserContext';

interface Props {
  topic: string;
  messages: Message[];
  userContext: UserContext | null;
  sessionSummary: SummaryData | null;
  isEndingSession: boolean;
  loading: boolean;
  onEndSession: () => void;
}

export default function TutorSidePanel({
  topic,
  messages,
  userContext,
  sessionSummary,
  isEndingSession,
  loading,
  onEndSession,
}: Props) {
  const t = useTranslations('tutor');

  return (
    <div className="w-36 flex-shrink-0 border-l border-gray-100 bg-gray-50 px-3 py-4 hidden md:flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('progress')}</p>
        <p className="text-xs font-semibold text-gray-700 mb-2 truncate">{topic}</p>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(90, (messages.filter((m) => m.role === 'model').length / 5) * 100)}%` }}
          />
        </div>
      </div>

      {userContext && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">레벨</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">{userContext.careerLevel}</p>
        </div>
      )}

      {sessionSummary && sessionSummary.concepts.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('concepts')}</p>
          <div className="flex flex-wrap gap-1">
            {sessionSummary.concepts.map((c) => (
              <span
                key={c}
                className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100"
              >
                ✓ {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={onEndSession}
          disabled={isEndingSession || loading}
          className="w-full text-[10px] text-gray-400 border border-gray-200 rounded-lg py-1.5 hover:bg-white hover:text-gray-600 disabled:opacity-40 transition-colors"
        >
          {t('endSession')}
        </button>
      </div>
    </div>
  );
}
