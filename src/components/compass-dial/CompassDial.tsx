'use client';

import { useId } from 'react';
import { circumference, computeProgressEndpoint, computeTicks } from './geometry';

export type CompassDialProps = {
  /** 0-100. What it represents is up to the caller - e.g. gap analysis, stage progress. */
  percent: number;
  size?: number;
  /** Sub-label under the percentage - should match whatever `percent` actually measures. */
  label?: string;
  showLabel?: boolean;
  colorFrom?: string;
  colorTo?: string;
  tickActiveColor?: string;
  tickInactiveColor?: string;
  trackColor?: string;
  markerFill?: string;
  textColor?: string;
  subLabelColor?: string;
  className?: string;
  /** Renders this in the dial's center instead of the percent/label text - e.g. a badge icon for a celebration card. Takes priority over showLabel. */
  centerIcon?: React.ReactNode;
};

export function CompassDial({
  percent,
  size = 176,
  label,
  showLabel = true,
  colorFrom = 'var(--color-pri)',
  colorTo = 'var(--color-pri-2)',
  tickActiveColor = 'var(--color-pri-2)',
  tickInactiveColor = 'var(--color-border)',
  trackColor = 'var(--color-surf-2)',
  markerFill = 'var(--color-bg)',
  textColor = 'var(--color-ink)',
  subLabelColor = 'var(--color-ink-dim)',
  className,
  centerIcon,
}: CompassDialProps) {
  const gradientId = `compass-dial-gradient-${useId().replace(/:/g, '')}`;
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clampedPercent = Math.max(0, Math.min(100, safePercent));
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;
  const strokeWidth = size * 0.055;
  const circ = circumference(radius);
  const ticks = computeTicks(size, radius, clampedPercent);
  const progressEnd = computeProgressEndpoint(size, radius, clampedPercent);

  const dial = (
    <svg width={size} height={size} className={centerIcon ? undefined : className}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />

      {ticks.map((tick) => (
        <line
          key={tick.key}
          x1={tick.from.x}
          y1={tick.from.y}
          x2={tick.to.x}
          y2={tick.to.y}
          stroke={tick.isActive ? tickActiveColor : tickInactiveColor}
          strokeWidth={tick.isMajor ? size * 0.014 : size * 0.007}
          strokeLinecap="round"
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - clampedPercent / 100)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      <circle cx={progressEnd.x} cy={progressEnd.y} r={size * 0.055} fill={colorTo} opacity={0.28} />
      <circle cx={progressEnd.x} cy={progressEnd.y} r={size * 0.032} fill={markerFill} />

      {!centerIcon && showLabel && (
        <text x={cx} y={cy - size * 0.02} textAnchor="middle" fontSize={size * 0.19} fontWeight={800} fill={textColor}>
          {Math.round(clampedPercent)} %
        </text>
      )}
      {!centerIcon && showLabel && label && (
        <text
          x={cx}
          y={cy + size * 0.11}
          textAnchor="middle"
          fontSize={size * 0.06}
          fontWeight={600}
          fill={subLabelColor}
        >
          {label}
        </text>
      )}
    </svg>
  );

  if (!centerIcon) return dial;

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      {dial}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {centerIcon}
      </div>
    </div>
  );
}
