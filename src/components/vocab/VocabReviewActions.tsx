'use client';

import { RotateCcw, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  onReview: (knew: boolean) => void;
  disabled?: boolean;
}

export default function VocabReviewActions({ onReview, disabled }: Props) {
  const t = useTranslations('vocab');

  return (
    <div className="flex gap-3 w-full max-w-sm mx-auto">
      <button
        onClick={() => onReview(false)}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-ink-dim text-sm font-medium hover:bg-surf-2 disabled:opacity-50 transition-colors"
      >
        <RotateCcw size={15} />
        {t('reviewAgain')}
      </button>
      <button
        onClick={() => onReview(true)}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        <Check size={15} />
        {t('reviewKnew')}
      </button>
    </div>
  );
}
