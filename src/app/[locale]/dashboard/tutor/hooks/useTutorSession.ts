'use client';

import type { PronunciationResult } from '@/lib/azure-pronunciation';
import { savePronunciationAttempt } from '@/lib/pronunciation';
import { insertWithUser } from '@/lib/supabase';
import { saveVocabWords } from '@/lib/vocab';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { UserContext } from './useUserContext';

export interface QuizData {
  question: string;
  options: string[];
  correct: number;
}

export interface VocabWordSuggestion {
  word: string;
  meaning: string;
  example: string;
}

export interface SummaryData {
  concepts: string[];
  tags: string[];
  tilNote?: string;
  /** Only present when the session had a targetLanguage - see sendToAI. */
  vocabWords?: VocabWordSuggestion[];
}

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  quiz?: QuizData;
  summary?: SummaryData;
  selectedOption?: number;
  isCodeReview?: boolean;
  /** User messages only - set when sent right after a voice recording whose transcript wasn't edited. */
  pronunciation?: PronunciationResult;
  /** Model messages only - the dialogue-only text the server extracted from [DIALOGUE] tags, for TTS playback. */
  dialogueText?: string;
}

export interface SavedRecord {
  title: string;
  date: string;
  duration: number;
  tags: string[];
}

export type TutorError =
  | { type: 'unavailable' } // 503 — 서버 과부하, 재시도 가능
  | { type: 'invalid' } // 400 — 요청 오류
  | { type: 'rateLimited' } // 429 — 오늘 사용량 한도 도달, 재시도해도 소용없음
  | { type: 'unknown' }; // 기타

interface UseTutorSessionParams {
  topic: string;
  userContext: UserContext | null;
  onComplete: (record: SavedRecord) => void;
}

export function useTutorSession({ topic, userContext, onComplete }: UseTutorSessionParams) {
  const t = useTranslations('tutor');
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<SummaryData | null>(null);
  const [lastError, setLastError] = useState<TutorError | null>(null);
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!topic || !userContext || startedRef.current) return;
    startedRef.current = true;
    sendToAI([]);
  }, [topic, userContext]);

  const sendToAI = async (
    history: Message[],
    requestSummary = false,
    codeReview = false,
    code = ''
  ): Promise<SummaryData | null> => {
    setLoading(true);
    setLastError(null);
    setRetryFn(null);

    const contents = history
      .map((m) => ({ role: m.role, parts: m.parts }))
      .filter((m) => m.parts.length > 0 && m.parts[0].text?.trim());

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: contents,
          locale,
          userContext,
          requestSummary,
          codeReview,
          code,
          targetLanguage: userContext?.targetLanguage ?? undefined,
        }),
      });

      if (!res.ok) {
        // res.status is the actual HTTP status Next.js sent (429 for the
        // rate limiter, 503/400 from further down) - errData.error.code was
        // never populated for those paths, so it silently fell through to
        // 'unknown' ("check your network") for a 429, which isn't a network
        // problem and retrying does nothing until tomorrow's reset.
        if (res.status === 429) {
          setLastError({ type: 'rateLimited' });
          return null;
        }

        const errData = await res.json().catch(() => ({}));
        const status = errData?.error?.code ?? res.status;

        if (status === 503) {
          setLastError({ type: 'unavailable' });
          setRetryFn(() => () => sendToAI(history, requestSummary, codeReview, code));
        } else if (status === 400) {
          setLastError({ type: 'invalid' });
        } else {
          setLastError({ type: 'unknown' });
        }
        return null;
      }

      const data = await res.json();
      const aiMsg: Message = {
        role: 'model',
        parts: [{ text: data.text }],
        quiz: data.quiz ?? undefined,
        summary: data.summary ?? undefined,
        dialogueText: data.dialogueText ?? undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.summary) setSessionSummary(data.summary);
      return data.summary ?? null;
    } catch {
      setLastError({ type: 'unknown' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryFn) retryFn();
  };

  const handleSend = async (text: string, pronunciation?: PronunciationResult) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', parts: [{ text }], pronunciation };
    const next = [...messages, userMsg];
    setMessages(next);
    if (pronunciation) savePronunciationAttempt(pronunciation.pronScore).catch(() => {});
    await sendToAI(next);
  };

  const handleCodeReviewSubmit = async (code: string) => {
    if (!code.trim() || loading) return;
    const userMsg: Message = {
      role: 'user',
      parts: [{ text: `코드 리뷰 요청:\n\`\`\`\n${code}\n\`\`\`` }],
      isCodeReview: true,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    await sendToAI(next, false, true, code);
  };

  const handleQuizSelect = async (msgIdx: number, optIdx: number) => {
    const quiz = messages[msgIdx].quiz;
    if (!quiz) return;
    const answerText = quiz.options[optIdx];
    const isCorrect = optIdx === quiz.correct;
    const correctText = quiz.options[quiz.correct];

    const userMsg: Message = {
      role: 'user',
      parts: [
        {
          text: isCorrect
            ? t('quizCorrect', { answer: answerText })
            : t('quizWrong', { answer: answerText, correct: correctText }),
        },
      ],
    };

    const updatedMessages = messages.map((m, i) => (i === msgIdx ? { ...m, selectedOption: optIdx } : m));
    const next = [...updatedMessages, userMsg];
    setMessages(next);
    await sendToAI(next);
  };

  const handleEndSession = async () => {
    if (isEndingSession || loading) return;
    setIsEndingSession(true);

    const summary = await sendToAI(messages, true);
    const finalSummary = summary ?? sessionSummary;

    if (timerRef.current) clearInterval(timerRef.current);
    const durationMin = Math.max(1, Math.round(elapsed / 60));
    const today = new Date().toISOString().split('T')[0];
    const tags = finalSummary?.tags ?? [topic];
    const tilNote = finalSummary?.tilNote ?? '';
    const title = `${topic} — ${t('aiTutorLabel')}`;

    try {
      await insertWithUser('sessions', {
        title,
        date: today,
        duration: durationMin,
        tags,
        til: tilNote,
        memo: `${t('aiTutorLabel')} (${durationMin}분)`,
        roadmap_id: userContext?.adoptedRoadmapId ?? null,
      });
      if (userContext?.targetLanguage && finalSummary?.vocabWords?.length) {
        await saveVocabWords(userContext.targetLanguage, finalSummary.vocabWords);
      }
      localStorage.removeItem('coach_suggestion');
      localStorage.removeItem('coach_suggestion_date');
    } catch (e) {
      console.error('세션 저장 실패:', e);
    }

    setIsEndingSession(false);
    onComplete({ title, date: today, duration: durationMin, tags });
  };

  return {
    messages,
    loading,
    isEndingSession,
    elapsedMin: Math.floor(elapsed / 60),
    sessionSummary,
    lastError,
    handleRetry,
    handleSend,
    handleCodeReviewSubmit,
    handleQuizSelect,
    handleEndSession,
  };
}
