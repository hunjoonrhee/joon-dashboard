'use client';

import type { PronunciationResult } from '@/lib/azure-pronunciation';
import { savePronunciationAttempt } from '@/lib/pronunciation';
import { insertWithUser } from '@/lib/supabase';
import { saveVocabWords } from '@/lib/vocab';
import { useTutorGuardStore } from '@/store/tutorGuardStore';
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
  | { type: 'unavailable' } // 502 — Gemini 과부하/실패, 재시도 가능
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
  const setGuardActive = useTutorGuardStore((s) => s.setActive);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Warns before leaving instead of silently losing the conversation - the
  // transcript only reaches the DB once handleEndSession finishes, so
  // navigating away (sidebar, logout, locale switch) before then would
  // otherwise discard everything with no confirmation. Only activates once
  // the user has actually said something; the AI's opening line alone isn't
  // worth guarding. Cleared here on unmount as a safety net, and explicitly
  // in handleEndSession once the transcript is actually saved.
  useEffect(() => {
    setGuardActive(messages.some((m) => m.role === 'user'));
  }, [messages, setGuardActive]);

  useEffect(() => {
    return () => setGuardActive(false);
  }, [setGuardActive]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!messages.some((m) => m.role === 'user')) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages]);

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
        // The route's error bodies are always flat { error: string } - there
        // was never a nested error.code to read, so this used to check
        // errData?.error?.code (always undefined) and fall through to
        // res.status anyway, except the branch below compared that to 503
        // when the route only ever sends 502 for an upstream AI failure.
        // Net effect: "AI busy, retry" never matched anything real, so
        // clicking retry silently did nothing - it fell into the 'unknown'
        // branch instead, which doesn't wire up a retry function at all.
        if (res.status === 429) {
          setLastError({ type: 'rateLimited' });
        } else if (res.status === 502) {
          setLastError({ type: 'unavailable' });
          setRetryFn(() => () => sendToAI(history, requestSummary, codeReview, code));
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

  const handleEndSession = async (saveTranscript: boolean) => {
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
        // sessions has both duration/duration_minutes and memo/notes from an
        // earlier schema drift (this insert used to write the former, the
        // manual "공부 기록 추가" flow and the session detail page both use
        // the latter, so AI tutor sessions silently never showed a duration).
        // Standardizing on duration_minutes here; memo was never read
        // anywhere so it's dropped rather than renamed.
        duration_minutes: durationMin,
        tags,
        til: tilNote,
        roadmap_id: userContext?.adoptedRoadmapId ?? null,
        // 세션 상세 페이지에서 채팅 UI 그대로(퀴즈 응답, TTS용 dialogueText,
        // 발음점수 포함) 재현할 수 있도록 대화 전체를 같이 저장 - 단, 사용자가
        // 저장을 선택했을 때만. 매 세션마다 자동으로 남기면 부담스러워하는
        // 피드백이 있어서 종료 시점에 확인을 받는다.
        transcript: saveTranscript ? { messages, targetLanguage: userContext?.targetLanguage ?? null } : null,
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
    setGuardActive(false);
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
