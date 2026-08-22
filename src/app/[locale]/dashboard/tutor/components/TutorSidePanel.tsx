'use client';

import { useGuardedAction } from '@/hooks/useGuardedNavigate';
import { BookMarked, Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
  const locale = useLocale();
  const router = useRouter();
  const guard = useGuardedAction();

  return (
    <div className="w-36 flex-shrink-0 border-l border-border bg-surf-2 px-3 py-4 hidden md:flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-1">{t('progress')}</p>
        <p className="text-xs font-semibold text-ink mb-2 truncate">{topic}</p>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-pri rounded-full transition-all duration-500"
            style={{ width: `${Math.min(90, (messages.filter((m) => m.role === 'model').length / 5) * 100)}%` }}
          />
        </div>
      </div>

      {userContext && (
        <div>
          <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-1">레벨</p>
          <p className="text-[10px] text-ink-dim leading-relaxed">{userContext.careerLevel}</p>
        </div>
      )}

      {sessionSummary && sessionSummary.concepts.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-2">{t('concepts')}</p>
          <div className="flex flex-wrap gap-1">
            {sessionSummary.concepts.map((c) => (
              <span
                key={c}
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-surf text-pri rounded-full border border-border"
              >
                <Check size={9} />
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => guard(() => router.push(`/${locale}/dashboard/vocab`))}
        className="flex items-center gap-1.5 text-[10px] text-ink-faint hover:text-pri transition-colors"
      >
        <BookMarked size={11} />
        {t('vocabLink')}
      </button>

      <div className="mt-auto">
        <button
          onClick={onEndSession}
          disabled={isEndingSession || loading}
          className="w-full text-[10px] text-ink-faint border border-border rounded-lg py-1.5 hover:bg-surf hover:text-ink-dim disabled:opacity-40 transition-colors"
        >
          {t('endSession')}
        </button>
      </div>
    </div>
  );
}
