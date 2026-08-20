'use client';

import { AlertTriangle, WifiOff, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Message, TutorError } from '../hooks/useTutorSession';
import TutorMessageItem from './TutorMessageItem';

interface Props {
  messages: Message[];
  loading: boolean;
  isEndingSession: boolean;
  lastError: TutorError | null;
  onQuizSelect: (msgIdx: number, optIdx: number) => void;
  onRetry: () => void;
}

export default function TutorChat({ messages, loading, isEndingSession, lastError, onQuizSelect, onRetry }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, lastError]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.map((msg, i) => (
        <TutorMessageItem key={i} message={msg} msgIdx={i} onQuizSelect={onQuizSelect} />
      ))}

      {(loading || isEndingSession) && (
        <div className="flex gap-1 px-4 py-3 bg-surf-2 rounded-2xl rounded-tl-sm w-fit">
          <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {lastError && !loading && (
        <div className="max-w-[88%]">
          {lastError.type === 'unavailable' && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 mb-1">AI 서버가 잠시 바빠요</p>
                <p className="text-xs text-amber-600 mb-2">
                  수요가 많아 일시적으로 응답이 어렵습니다. 잠깐 후 다시 시도해보세요.
                </p>
                <button
                  onClick={onRetry}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber text-on-pri hover:opacity-90 transition-colors"
                >
                  ↻ 다시 시도
                </button>
              </div>
            </div>
          )}

          {lastError.type === 'invalid' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">요청 오류가 발생했어요</p>
                <p className="text-xs text-red-500">
                  메시지 형식에 문제가 있어요. 새 메시지를 입력해서 계속 진행해보세요.
                </p>
              </div>
            </div>
          )}

          {lastError.type === 'unknown' && (
            <div className="flex items-start gap-3 bg-surf-2 border border-border rounded-2xl px-4 py-3">
              <WifiOff size={16} className="text-ink-faint flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-dim mb-1">연결에 문제가 생겼어요</p>
                <p className="text-xs text-ink-faint mb-2">네트워크 상태를 확인하고 다시 시도해보세요.</p>
                <button
                  onClick={onRetry}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink text-bg hover:opacity-90 transition-colors"
                >
                  ↻ 다시 시도
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
