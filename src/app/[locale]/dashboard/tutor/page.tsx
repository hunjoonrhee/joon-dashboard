'use client';

import { insertWithUser, supabase } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface QuizData {
  question: string;
  options: string[];
  correct: number;
}

interface SummaryData {
  concepts: string[];
  tags: string[];
  tilNote?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  quiz?: QuizData;
  summary?: SummaryData;
  selectedOption?: number;
}

interface UserContext {
  careerLevel: string;
  recentTags: string[];
  gapSkills: string[];
  projects: string[];
  goal: string;
  tilHistory: string[];
}

type PageState = 'loading' | 'session' | 'gate' | 'complete';

async function loadUserContext(topic: string): Promise<UserContext> {
  try {
    const [settingsRes, sessionsRes, roadmapRes, projectsRes] = await Promise.all([
      supabase.from('settings').select('key, value').in('key', ['career_level', 'adopted_roadmap_id']),
      supabase.from('sessions').select('tags, date, til').order('date', { ascending: false }).limit(30),
      supabase.from('ai_roadmaps').select('goal, stages').eq('adopted', true).single(),
      supabase.from('projects').select('name').eq('status', 'in_progress').limit(5),
    ]);

    const careerLevel =
      settingsRes.data?.find((s: { key: string; value: string }) => s.key === 'career_level')?.value ?? 'Not specified';

    const sessions = sessionsRes.data ?? [];
    const recentTags = [...new Set(sessions.flatMap((s: { tags: string[] }) => s.tags))] as string[];

    // TIL 히스토리 — 있는 것만
    const tilHistory = sessions
      .filter((s: { til?: string }) => s.til && s.til.trim().length > 0)
      .map((s: { til: string }) => s.til)
      .slice(0, 5);

    const adoptedRoadmap = roadmapRes.data as AiRoadmap | null;
    const studiedTagSet = new Set(recentTags);
    const gapSkills = adoptedRoadmap
      ? adoptedRoadmap.stages.flatMap((stage) =>
          stage.skills.filter((sk) => !sk.tags.some((tag: string) => studiedTagSet.has(tag))).map((sk) => sk.name)
        )
      : [];

    const projects = (projectsRes.data ?? []).map((p: { name: string }) => p.name);

    return { careerLevel, recentTags, gapSkills, projects, goal: adoptedRoadmap?.goal ?? topic, tilHistory };
  } catch {
    return { careerLevel: 'Not specified', recentTags: [], gapSkills: [], projects: [], goal: topic, tilHistory: [] };
  }
}

export default function TutorPage() {
  const t = useTranslations('tutor');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const topic = searchParams.get('topic') ?? '';
  const isGate = searchParams.get('gate') === 'true';

  const [pageState, setPageState] = useState<PageState>(isGate ? 'gate' : 'loading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<SummaryData | null>(null);
  const [savedRecord, setSavedRecord] = useState<{
    title: string;
    date: string;
    duration: number;
    tags: string[];
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isGate || !topic) return;
    loadUserContext(topic).then((ctx) => {
      setUserContext(ctx);
      setPageState('session');
    });
  }, [topic, isGate]);

  useEffect(() => {
    if (pageState !== 'session') return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pageState]);

  useEffect(() => {
    if (pageState !== 'session' || !topic || !userContext || startedRef.current) return;
    startedRef.current = true;
    sendToAI([]);
  }, [pageState, topic, userContext]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToAI = async (history: Message[], requestSummary = false) => {
    setLoading(true);
    const contents = history.map((m) => ({ role: m.role, parts: m.parts }));
    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, messages: contents, locale, userContext, requestSummary }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: 'model',
        parts: [{ text: data.text }],
        quiz: data.quiz ?? undefined,
        summary: data.summary ?? undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.summary) setSessionSummary(data.summary);
      return data.summary ?? null;
    } catch {
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: t('errorMessage') }] }]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', parts: [{ text }] };
    const next = [...messages, userMsg];
    setMessages(next);
    await sendToAI(next);
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

    // 1. AI한테 SUMMARY 요청
    const summary = await sendToAI(messages, true);
    const finalSummary = summary ?? sessionSummary;

    // 2. 타이머 종료
    if (timerRef.current) clearInterval(timerRef.current);
    const durationMin = Math.max(1, Math.round(elapsed / 60));
    const today = new Date().toISOString().split('T')[0];
    const tags = finalSummary?.tags ?? [topic];
    const tilNote = finalSummary?.tilNote ?? '';
    const title = `${topic} — ${t('aiTutorLabel')}`;

    // 3. sessions에 저장 (til 포함)
    try {
      await insertWithUser('sessions', {
        title,
        date: today,
        duration: durationMin,
        tags,
        til: tilNote,
        memo: `${t('aiTutorLabel')} (${durationMin}분)`,
      });
    } catch (e) {
      console.error('세션 저장 실패:', e);
    }

    setSavedRecord({ title, date: today, duration: durationMin, tags });
    setIsEndingSession(false);
    setPageState('complete');
  };

  const elapsedMin = Math.floor(elapsed / 60);

  // ── 로딩 ──
  if (pageState === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">준비 중...</p>
        </div>
      </main>
    );
  }

  // ── Pro 게이트 ──
  if (pageState === 'gate') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✨
          </div>
          <h1 className="text-base font-bold text-gray-900 mb-2">{t('proGateTitle')}</h1>
          <p className="text-xs text-gray-500 leading-relaxed mb-5">{t('proGateSub')}</p>
          <ul className="text-left flex flex-col gap-2 mb-6">
            {[t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-indigo-500">✓</span> {f}
              </li>
            ))}
          </ul>
          <button className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors mb-2">
            👑 {t('upgrade')}
          </button>
          <p className="text-xs text-gray-400">{t('upgradePrice')}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('backBtn')}
          </button>
        </div>
      </main>
    );
  }

  // ── 세션 완료 ──
  if (pageState === 'complete') {
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
            <button
              disabled
              title={t('continueDisabled')}
              className="px-3 py-2 rounded-xl border border-gray-100 text-xs text-gray-300 cursor-not-allowed"
            >
              {t('continueSession')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 튜터 세션 ──
  return (
    <main className="flex flex-col h-[calc(100vh-57px)]">
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
            onClick={handleEndSession}
            disabled={isEndingSession || loading}
            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {isEndingSession ? '요약 중...' : t('endSession')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'model' && (
                  <div className="flex flex-col gap-2 max-w-[88%]">
                    {msg.parts[0].text && (
                      <div
                        className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none
  prose-code:bg-gray-100 prose-code:px-1.5 prose-code:rounded prose-code:text-indigo-600 prose-code:font-mono
  prose-pre:!bg-gray-900 prose-pre:!text-gray-100 prose-pre:rounded-xl prose-pre:text-xs prose-pre:overflow-x-auto
  [&_pre_code]:!bg-transparent [&_pre_code]:!text-gray-100 [&_pre_code]:!p-0"
                      >
                        <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                      </div>
                    )}
                    {msg.quiz && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-semibold text-amber-600 mb-2 uppercase tracking-wider">
                          {t('quizLabel')}
                        </p>
                        <p className="text-sm text-amber-900 font-medium mb-3">{msg.quiz.question}</p>
                        <div className="flex flex-col gap-1.5">
                          {msg.quiz.options.map((opt, optIdx) => {
                            const selected = msg.selectedOption !== undefined;
                            const isSelected = msg.selectedOption === optIdx;
                            const isCorrect = optIdx === msg.quiz!.correct;
                            let cls = 'text-xs px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left ';
                            if (!selected) cls += 'bg-white border-amber-200 text-amber-800 hover:bg-amber-100';
                            else if (isCorrect) cls += 'bg-emerald-50 border-emerald-200 text-emerald-800';
                            else if (isSelected) cls += 'bg-red-50 border-red-200 text-red-700';
                            else cls += 'bg-white border-gray-100 text-gray-400';
                            return (
                              <button
                                key={optIdx}
                                className={cls}
                                onClick={() => !selected && handleQuizSelect(i, optIdx)}
                                disabled={selected}
                              >
                                {isCorrect && selected && '✓ '}
                                {isSelected && !isCorrect && '✗ '}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
                      <p className="text-sm leading-relaxed">{msg.parts[0].text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(loading || isEndingSession) && (
              <div className="flex gap-1 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm w-fit">
                <span
                  className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-gray-100 px-4 py-3 flex gap-2 flex-shrink-0 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('inputPlaceholder')}
              disabled={isEndingSession}
              rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-300 focus:bg-white transition-colors disabled:opacity-40 resize-none overflow-hidden"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || isEndingSession}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('send')}
            </button>
          </div>
        </div>

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
              onClick={handleEndSession}
              disabled={isEndingSession || loading}
              className="w-full text-[10px] text-gray-400 border border-gray-200 rounded-lg py-1.5 hover:bg-white hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              {t('endSession')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
