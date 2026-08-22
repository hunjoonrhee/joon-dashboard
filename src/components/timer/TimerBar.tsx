'use client';

import { useModalStore } from '@/store/modalStore';
import { getTimerElapsedSeconds, useTimerStore } from '@/store/timerStore';
import { Check, Pause, Play, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const formatElapsed = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Persistent bar shown app-wide (via AppShell) whenever a study timer is running or paused - lets self-directed study (reading, watching a course, anything outside an AI tutor session) get logged with real elapsed time instead of a guessed duration. State lives in localStorage via useTimerStore so it survives a tab reload; elapsed time is always recomputed from wall-clock timestamps, never a ticking counter, so backgrounding the tab can't drift it. */
export default function TimerBar() {
  const t = useTranslations('timer');
  const { status, topic, startedAt, accumulatedSeconds, setTopic, pause, resume, finish, discard } = useTimerStore();
  const openStudyModal = useModalStore((s) => s.openStudyModal);
  const originalTitleRef = useRef<string | null>(null);

  // Re-renders once a second while running so the displayed elapsed time keeps
  // ticking - the value itself is always recomputed from startedAt below, never
  // from a counter, so this interval only drives re-renders, not the math.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsed = getTimerElapsedSeconds({ status, startedAt, accumulatedSeconds });

  useEffect(() => {
    if (status === 'idle') {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
      return;
    }
    if (originalTitleRef.current === null) originalTitleRef.current = document.title;
    const statusLabel = status === 'running' ? t('tabTitleRunning') : t('tabTitlePaused');
    document.title = `${formatElapsed(elapsed)} · ${statusLabel}`;
  }, [status, elapsed, t]);

  if (status === 'idle') return null;

  const handleFinish = () => {
    const result = finish();
    if (result) openStudyModal(result.topic, result.minutes);
  };

  return (
    <div className="sticky top-12 lg:top-[57px] z-10 flex items-center gap-3 px-4 lg:px-6 h-12 bg-pri/10 border-b border-pri/20">
      <button
        onClick={status === 'running' ? pause : resume}
        aria-label={status === 'running' ? t('pause') : t('resume')}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-pri text-on-pri flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {status === 'running' ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
      </button>

      <span className="flex-shrink-0 text-sm font-bold text-pri tabular-nums w-16">{formatElapsed(elapsed)}</span>

      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={t('topicPlaceholder')}
        className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
      />

      <button
        onClick={handleFinish}
        aria-label={t('finish')}
        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        <Check size={13} /> {t('finish')}
      </button>

      <button
        onClick={discard}
        aria-label={t('discard')}
        className="flex-shrink-0 text-ink-faint hover:text-red-400 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
