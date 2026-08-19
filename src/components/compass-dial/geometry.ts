export type Point = { x: number; y: number };

/** Rounds to 3 decimals so the SSR-rendered string and the client-computed
 * float always serialize identically - full float precision here caused a
 * React hydration mismatch (server/client differed in the last digit). */
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** angleDeg: 0 = top of the circle, increases clockwise. */
export function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: round(cx + radius * Math.cos(angleRad)),
    y: round(cy + radius * Math.sin(angleRad)),
  };
}

export type TickGeometry = {
  key: number;
  isMajor: boolean;
  isActive: boolean;
  from: Point;
  to: Point;
};

const TICK_COUNT = 60;
const MAJOR_TICK_EVERY = 5;

export function computeTicks(size: number, radius: number, percent: number): TickGeometry[] {
  const outer = radius + size * 0.045;
  const innerMajor = radius + size * 0.005;
  const innerMinor = radius + size * 0.01;
  const cx = size / 2;
  const cy = size / 2;

  return Array.from({ length: TICK_COUNT }, (_, i) => {
    const angleDeg = (i / TICK_COUNT) * 360;
    const isMajor = i % MAJOR_TICK_EVERY === 0;
    const inner = isMajor ? innerMajor : innerMinor;
    return {
      key: i,
      isMajor,
      isActive: (i / TICK_COUNT) * 100 < percent,
      from: polarToCartesian(cx, cy, outer, angleDeg),
      to: polarToCartesian(cx, cy, inner, angleDeg),
    };
  });
}

export function computeProgressEndpoint(size: number, radius: number, percent: number): Point {
  const cx = size / 2;
  const cy = size / 2;
  return polarToCartesian(cx, cy, radius, (percent / 100) * 360);
}

export function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}
