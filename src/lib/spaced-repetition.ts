/** Simplified SM-2: binary knew/didn't-know review instead of the full 0-5 grade scale. */

const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 9.99;

export type ReviewInput = {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
};

export type ReviewResult = {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  nextReviewAt: string;
};

export function computeNextReview(current: ReviewInput, knew: boolean): ReviewResult {
  if (!knew) {
    return {
      intervalDays: 1,
      easeFactor: clamp(current.easeFactor - 0.2),
      reviewCount: 0,
      nextReviewAt: addDays(1),
    };
  }

  const reviewCount = current.reviewCount + 1;
  const easeFactor = clamp(current.easeFactor + 0.1);
  const intervalDays = reviewCount === 1 ? 1 : reviewCount === 2 ? 6 : Math.round(current.intervalDays * easeFactor);

  return { intervalDays, easeFactor, reviewCount, nextReviewAt: addDays(intervalDays) };
}

function clamp(easeFactor: number): number {
  return Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, easeFactor));
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
