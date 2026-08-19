'use client';

import { CompassDial } from '@/components/compass-dial';
import type { CelebrationOptions } from '@/lib/celebration-context';
import { useEffect, useState } from 'react';
import { CELEBRATION_THEMES } from './celebration-themes';

const DIAL_MS = 340;
const DIAL_SIZE = 176;

function useCountUp(target: number, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export function CelebrationPage({ celebration, onAct }: { celebration: CelebrationOptions; onAct: () => void }) {
  const theme = CELEBRATION_THEMES[celebration.colorTheme ?? 'green'];
  const targetPercent = celebration.percent ?? 100;
  const animatedPercent = useCountUp(targetPercent, DIAL_MS);
  const showPercentLabel = celebration.percent !== undefined && !celebration.centerIcon && !celebration.centerLabel;

  return (
    <div
      className="flex-shrink-0 w-full h-full flex flex-col items-center justify-center px-8 text-center"
      style={{
        background: `linear-gradient(160deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
        scrollSnapAlign: 'start',
      }}
    >
      <div className="relative flex items-center justify-center mb-7" style={{ width: DIAL_SIZE, height: DIAL_SIZE }}>
        <span
          className="celebration-ring absolute inset-0 rounded-full border-2"
          style={{ borderColor: theme.ringColor, animationDelay: '0ms' }}
        />
        <span
          className="celebration-ring absolute inset-0 rounded-full border-2"
          style={{ borderColor: theme.ringColor, animationDelay: '550ms' }}
        />
        <CompassDial
          percent={animatedPercent}
          size={DIAL_SIZE}
          showLabel={showPercentLabel}
          colorFrom={theme.dialColorFrom}
          colorTo={theme.dialColorTo}
          tickActiveColor={theme.dialColorTo}
          tickInactiveColor="rgba(255,255,255,0.2)"
          trackColor={theme.dialTrack}
          markerFill={theme.markerFill}
          textColor={theme.titleColor}
          subLabelColor={theme.subtitleColor}
          centerIcon={
            celebration.centerIcon ? (
              <div style={{ color: theme.titleColor }}>{celebration.centerIcon}</div>
            ) : celebration.centerLabel ? (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold" style={{ color: theme.titleColor }}>
                  {celebration.centerLabel.value}
                </span>
                {celebration.centerLabel.caption && (
                  <span className="text-xs font-semibold mt-1" style={{ color: theme.subtitleColor }}>
                    {celebration.centerLabel.caption}
                  </span>
                )}
              </div>
            ) : undefined
          }
        />
      </div>

      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.eyebrowColor }}>
        {celebration.eyebrow}
      </p>
      <h2 className="text-2xl font-extrabold leading-tight mb-3 max-w-xs" style={{ color: theme.titleColor }}>
        {celebration.title}
      </h2>
      <p className="text-sm leading-relaxed max-w-xs mb-8" style={{ color: theme.subtitleColor }}>
        {celebration.subtitle}
      </p>

      <button
        onClick={() => {
          celebration.onPrimary();
          onAct();
        }}
        className="w-full max-w-xs py-3.5 rounded-2xl text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: theme.buttonBg, color: theme.buttonText }}
      >
        {celebration.primaryLabel}
      </button>

      {celebration.secondaryLabel && (
        <button
          onClick={() => {
            celebration.onSecondary?.();
            onAct();
          }}
          className="mt-3 text-sm font-semibold"
          style={{ color: theme.secondaryColor }}
        >
          {celebration.secondaryLabel}
        </button>
      )}
    </div>
  );
}
