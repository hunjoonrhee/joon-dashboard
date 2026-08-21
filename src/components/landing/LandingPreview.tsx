'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// Steps 2 & 3 are real screen recordings (goal -> AI roadmap generating,
// an actual tutor conversation happening) so the walkthrough shows the app
// doing something instead of five frozen screens; the rest are clean static
// shots. next/image can't preserve GIF animation without extra config, so
// every step renders through a plain <img> for consistency.
const STEP_FILES = [
  { slug: 'step-1-goal', ext: 'jpg' },
  { slug: 'step-2-roadmap', ext: 'gif' },
  { slug: 'step-3-record', ext: 'gif' },
  { slug: 'step-4-recommend', ext: 'jpg' },
  { slug: 'step-5-achievements', ext: 'jpg' },
];
const SUPPORTED_LOCALES = ['ko', 'en', 'de'];

const STEP_COUNT = STEP_FILES.length;
const DEFAULT_ADVANCE_MS = 5000;
const TICK_MS = 50;

// Steps 2 & 3's GIFs run 12-26s depending on locale (each was recorded live,
// not scripted to a fixed length) - matching the auto-advance timer to each
// clip's actual total frame duration keeps the progress bar in sync with the
// recording instead of racing ahead on a flat 5s timer. Static jpg steps
// (1, 4, 5) fall back to DEFAULT_ADVANCE_MS.
const GIF_DURATIONS_MS: Record<string, Partial<Record<number, number>>> = {
  ko: { 1: 12600, 2: 26000 },
  en: { 1: 21050, 2: 24750 },
  de: { 1: 20600, 2: 25200 },
};

function PreviewBar() {
  return (
    <div className="bg-surf-2 px-4 py-2.5 flex items-center gap-2 border-b border-border rounded-t-2xl">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-pri/70" />
      <div className="flex-1 bg-surf rounded-md py-1 px-3 text-xs text-ink-faint text-center">
        growpath.app/dashboard
      </div>
    </div>
  );
}

export default function LandingPreview() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const imageLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
  const stepImages = STEP_FILES.map(({ slug, ext }) => `/landing-steps/${slug}-${imageLocale}.${ext}`);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  // GIFs keep looping in the background even while hidden (opacity-0), so
  // without this a step revisited later shows wherever its loop happened to
  // land instead of restarting from frame 1. Bumping this per-step counter
  // each time a step becomes active changes its <img> key, forcing React to
  // remount the element so the GIF restarts from the beginning.
  const [restartCounts, setRestartCounts] = useState<number[]>(() => STEP_FILES.map(() => 0));

  useEffect(() => {
    setRestartCounts((counts) => counts.map((c, i) => (i === step ? c + 1 : c)));
  }, [step]);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const advanceMs = GIF_DURATIONS_MS[imageLocale]?.[step] ?? DEFAULT_ADVANCE_MS;
    setProgress(0);
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += TICK_MS;
      const pct = (elapsed / advanceMs) * 100;
      if (pct >= 100) {
        clearInterval(id);
        setStep((s) => (s + 1) % STEP_COUNT);
      } else {
        setProgress(pct);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [step, paused, imageLocale]);

  const steps = Array.from({ length: STEP_COUNT }, (_, i) => ({
    title: t(`previewStep${i + 1}Title`),
    desc: t(`previewStep${i + 1}Desc`),
  }));

  const goTo = (i: number) => {
    setStep((i + STEP_COUNT) % STEP_COUNT);
    setProgress(0);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 mb-20">
      <p className="text-center text-xs font-semibold text-ink-faint uppercase tracking-widest mb-4">
        {t('previewLabel')}
      </p>
      <div
        className="bg-surf border border-border rounded-2xl overflow-hidden shadow-2xl shadow-pri/5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <PreviewBar />
        <div className="relative aspect-[1470/656] bg-surf-2">
          {stepImages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- next/image drops GIF animation without extra config; plain img keeps steps 2/3's screen recordings moving.
            <img
              key={`${src}-${restartCounts[i]}`}
              src={src}
              alt={steps[i].title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === step ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((s, i) => (
              <button
                key={s.title}
                onClick={() => goTo(i)}
                aria-label={s.title}
                className="relative flex-1 h-1 rounded-full bg-border overflow-hidden cursor-pointer"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-pri rounded-full"
                  style={{ width: i < step ? '100%' : i === step ? `${progress}%` : '0%' }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-pri mb-1">
                {t('previewStepPrefix')} {step + 1}
              </p>
              <h3 className="text-base font-bold text-ink mb-1">{steps[step].title}</h3>
              <p className="text-sm text-ink-dim">{steps[step].desc}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => goTo(step - 1)}
                aria-label={t('previewPrev')}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-ink-dim hover:bg-surf-2 transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <button
                onClick={() => goTo(step + 1)}
                aria-label={t('previewNext')}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-ink-dim hover:bg-surf-2 transition-colors"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
