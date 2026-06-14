'use client';

import type { AiRoadmap, Goal, Session } from '@/types';
import { useModalStore } from '@/store/modalStore';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CoachResource {
  type: 'docs' | 'youtube' | 'book' | 'course';
  title: string;
  description: string;
  searchQuery: string;
}

interface CoachSuggestion {
  insufficient?: boolean;
  insufficientMessage?: string;
  today: { skill: string; reason: string };
  resources?: CoachResource[];
  pace: {
    currentMonths: number;
    optimizedMonths: number;
    sessionsPerWeek: number;
    message: string;
  };
  alert: { hasAlert: boolean; message: string };
}

interface Props {
  sessions: Session[];
  goals: Goal[];
  adoptedRoadmap: AiRoadmap | null;
  onRefresh?: () => void;
  isPro?: boolean;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const MIN_SESSIONS = 3;

export default function CoachCard({ sessions, goals, adoptedRoadmap, onRefresh, isPro = false }: Props) {
  const t = useTranslations('coach');
  const tTutor = useTranslations('tutor');
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<CoachSuggestion | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const { openStudyModal } = useModalStore();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cached = localStorage.getItem('coach_suggestion');
    const cachedDate = localStorage.getItem('coach_suggestion_date');
    if (cached && cachedDate === today) {
      setData(JSON.parse(cached));
      setStatus('done');
      setLastFetched(cachedDate);
    }
  }, [today]);

  const getAdvice = async () => {
    if (!adoptedRoadmap) return;
    setStatus('loading');
    try {
      const res = await window.fetch('/api/coach/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions,
          adoptedRoadmap,
          goals,
          locale,
          careerLevel: adoptedRoadmap?.career_level ?? '',
        }),
      });
      if (!res.ok) throw new Error();
      const json: CoachSuggestion = await res.json();
      setData(json);
      setStatus('done');
      setLastFetched(today);
      localStorage.setItem('coach_suggestion', JSON.stringify(json));
      localStorage.setItem('coach_suggestion_date', today);
    } catch {
      setStatus('error');
    }
  };

  const handleStartTutor = () => {
    if (!data?.today?.skill) return;
    if (!isPro) {
      router.push(`/${locale}/dashboard/tutor?gate=true`);
      return;
    }
    const topic = encodeURIComponent(data.today.skill);
    router.push(`/${locale}/dashboard/tutor?topic=${topic}`);
  };

  if (!adoptedRoadmap) return null;

  const hasEnoughData = sessions.length >= MIN_SESSIONS;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('title')}</p>
          </div>
          {hasEnoughData && (
            <button
              onClick={getAdvice}
              disabled={status === 'loading'}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-40 transition-colors"
            >
              {status === 'loading'
                ? t('analyzing')
                : lastFetched === today
                  ? `↻ ${t('refresh')}`
                  : `✦ ${t('getAdvice')}`}
            </button>
          )}
        </div>

        {!hasEnoughData && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-400">📊</p>
            <p className="text-xs text-gray-400 mt-1">
              {t('insufficientData', {
                current: sessions.length,
                min: MIN_SESSIONS,
              })}
            </p>
          </div>
        )}

        {hasEnoughData && status === 'idle' && (
          <div className="text-center py-3">
            <p className="text-xs text-gray-400">{t('idleMessage')}</p>
            <button
              onClick={getAdvice}
              className="mt-2 px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
            >
              {t('getAdvice')}
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-2">
            <p className="text-xs text-red-400 mb-2">{t('error')}</p>
            <button
              onClick={getAdvice}
              className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
            >
              {t('getAdvice')}
            </button>
          </div>
        )}

        {status === 'done' && data && (
          <div className="flex flex-col gap-3">
            {data.insufficient && <p className="text-xs text-gray-400 text-center py-2">{data.insufficientMessage}</p>}

            {!data.insufficient && (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-indigo-600 mb-1">⚡ {t('todaySkill')}</p>
                  <p className="text-sm font-bold text-indigo-800">{data.today.skill}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{data.today.reason}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleStartTutor}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
                    >
                      ▶ {tTutor('startStudy')}
                      {!isPro && (
                        <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>
                      )}
                    </button>
                    <button
                      onClick={() => openStudyModal(data.today.skill)}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100"
                    >
                      + {t('addStudy')}
                    </button>
                  </div>
                </div>

                {data.resources && data.resources.length > 0 && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">📚 {t('resources')}</p>
                    <div className="flex flex-col gap-2">
                      {data.resources.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sm flex-shrink-0">
                            {r.type === 'docs' ? '📄' : r.type === 'youtube' ? '▶' : r.type === 'book' ? '📖' : '🎓'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {r.title} ↗
                            </a>
                            <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">📈 {t('pace')}</p>
                  <p className="text-xs text-gray-600">{data.pace.message}</p>
                  <div className="flex gap-3 mt-2">
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-700">{Math.round(data.pace.currentMonths)}</p>
                      <p className="text-xs text-gray-400">{t('monthsCurrent')}</p>
                    </div>
                    <div className="text-gray-300 self-center">→</div>
                    <div className="text-center">
                      <p className="text-base font-bold text-indigo-600">{Math.round(data.pace.optimizedMonths)}</p>
                      <p className="text-xs text-gray-400">{t('monthsOptimized')}</p>
                    </div>
                  </div>
                </div>

                {data.alert.hasAlert && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-600 mb-1">⚠ {t('alert')}</p>
                    <p className="text-xs text-amber-700">{data.alert.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
