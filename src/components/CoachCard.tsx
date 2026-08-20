'use client';

import { CompassDial } from '@/components/compass-dial';
import { useModalStore } from '@/store/modalStore';
import type { AiRoadmap, Goal, Session } from '@/types';
import { AlertTriangle, Bot, BookOpen, FileText, GraduationCap, Play, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

const resourceIcon = { docs: FileText, youtube: Play, book: BookOpen, course: GraduationCap };

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
  const hasEnoughData = sessions.length >= MIN_SESSIONS;
  const progressPct = Math.min((sessions.length / MIN_SESSIONS) * 100, 100);

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

  const handleStartTutorDirect = () => {
    if (!isPro) {
      router.push(`/${locale}/dashboard/tutor?gate=true`);
      return;
    }
    const topic = encodeURIComponent(adoptedRoadmap?.goal ?? '');
    router.push(`/${locale}/dashboard/tutor?topic=${topic}`);
  };

  if (!adoptedRoadmap) return null;

  return (
    <div className="bg-surf border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={16} strokeWidth={1.8} className="text-pri" />
          <p className="text-xs font-bold text-ink uppercase tracking-wider">{t('title')}</p>
        </div>
        {hasEnoughData && (
          <button
            onClick={getAdvice}
            disabled={status === 'loading'}
            className="text-xs text-pri hover:opacity-80 font-medium disabled:opacity-40 transition-colors"
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
        <div className="flex items-center gap-3 py-1">
          <CompassDial percent={progressPct} size={44} showLabel={false} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-dim">
                {t('insufficientData', {
                  current: sessions.length,
                  min: MIN_SESSIONS,
                })}
              </p>
              <span className="text-xs font-bold text-pri flex-shrink-0">
                {sessions.length}/{MIN_SESSIONS}
              </span>
            </div>
            <p className="text-xs text-ink-faint mt-1">
              {t('insufficientGuide', { remaining: MIN_SESSIONS - sessions.length })}
            </p>
          </div>
        </div>
      )}

      {!hasEnoughData && (
        <button
          onClick={handleStartTutorDirect}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 transition-colors self-start"
        >
          <Play size={11} fill="currentColor" /> {tTutor('startStudy')}
          {!isPro && <span className="ml-1 bg-white/20 text-on-pri text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>}
        </button>
      )}

      {hasEnoughData && status === 'idle' && (
        <div className="text-center py-3">
          <p className="text-xs text-ink-faint">{t('idleMessage')}</p>
          <button
            onClick={getAdvice}
            className="mt-2 px-4 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 transition-colors"
          >
            {t('getAdvice')}
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3 bg-surf-2 rounded w-3/4" />
          <div className="h-3 bg-surf-2 rounded w-1/2" />
          <div className="h-3 bg-surf-2 rounded w-2/3" />
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-2">
          <p className="text-xs text-red-400 mb-2">{t('error')}</p>
          <button
            onClick={getAdvice}
            className="px-4 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 transition-colors"
          >
            {t('getAdvice')}
          </button>
        </div>
      )}

      {status === 'done' && data && (
        <div className="flex flex-col gap-3">
          {data.insufficient && <p className="text-xs text-ink-faint text-center py-2">{data.insufficientMessage}</p>}

          {!data.insufficient && (
            <>
              <div className="bg-surf-2 border border-border rounded-xl p-3">
                <p className="text-xs font-semibold text-pri mb-1">⚡ {t('todaySkill')}</p>
                <p className="text-sm font-bold text-ink">{data.today.skill}</p>
                <p className="text-xs text-ink-dim mt-0.5">{data.today.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleStartTutor}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 transition-colors"
                  >
                    <Play size={11} fill="currentColor" /> {tTutor('startStudy')}
                    {!isPro && (
                      <span className="ml-1 bg-white/20 text-on-pri text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>
                    )}
                  </button>
                  <button
                    onClick={() => openStudyModal(data.today.skill)}
                    className="text-xs text-pri font-medium hover:opacity-80 transition-colors border border-border rounded-lg px-2.5 py-1.5 hover:bg-border"
                  >
                    + {t('addStudy')}
                  </button>
                </div>
              </div>

              {data.resources && data.resources.length > 0 && (
                <div className="bg-surf-2 border border-border rounded-xl p-3">
                  <p className="text-xs font-semibold text-ink-dim mb-2">{t('resources')}</p>
                  <div className="flex flex-col gap-2">
                    {data.resources.map((r, i) => {
                      const Icon = resourceIcon[r.type];
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Icon size={14} strokeWidth={1.8} className="text-ink-faint flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-pri hover:opacity-80 hover:underline"
                            >
                              {r.title} ↗
                            </a>
                            <p className="text-xs text-ink-faint mt-0.5">{r.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-surf-2 border border-border rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={13} strokeWidth={1.8} className="text-ink-dim" />
                  <p className="text-xs font-semibold text-ink-dim">{t('pace')}</p>
                </div>
                <p className="text-xs text-ink-dim">{data.pace.message}</p>
                <div className="flex gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-base font-bold text-ink">{Math.round(data.pace.currentMonths)}</p>
                    <p className="text-xs text-ink-faint">{t('monthsCurrent')}</p>
                  </div>
                  <div className="text-ink-faint self-center">→</div>
                  <div className="text-center">
                    <p className="text-base font-bold text-pri">{Math.round(data.pace.optimizedMonths)}</p>
                    <p className="text-xs text-ink-faint">{t('monthsOptimized')}</p>
                  </div>
                </div>
              </div>

              {data.alert.hasAlert && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} strokeWidth={1.8} className="text-amber" />
                    <p className="text-xs font-semibold text-amber">{t('alert')}</p>
                  </div>
                  <p className="text-xs text-amber-700">{data.alert.message}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
