'use client';

import type { PronunciationResult } from '@/lib/azure-pronunciation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const GOOD_SCORE_THRESHOLD = 80;

export default function PronunciationChip({ pronunciation }: { pronunciation: PronunciationResult }) {
  const t = useTranslations('tutor');
  const [expanded, setExpanded] = useState(false);
  const score = Math.round(pronunciation.pronScore);
  const good = score >= GOOD_SCORE_THRESHOLD;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-1 text-[11px] font-semibold ${good ? 'text-on-pri' : 'text-amber-200'} opacity-90 hover:opacity-100`}
      >
        {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {t('pronunciationScore', { score })}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {pronunciation.words.map((w, i) => (
            <span
              key={i}
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                w.accuracyScore >= GOOD_SCORE_THRESHOLD ? 'bg-white/20 text-on-pri' : 'bg-white/20 text-amber-100'
              }`}
            >
              {w.word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
