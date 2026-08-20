'use client';

import type { VocabWord } from '@/types';
import { useTranslations } from 'next-intl';

interface Props {
  word: VocabWord;
  flipped: boolean;
  onFlip: () => void;
}

export default function VocabCard({ word, flipped, onFlip }: Props) {
  const t = useTranslations('vocab');

  return (
    <div className="[perspective:1000px] w-full aspect-[4/3] max-w-sm mx-auto cursor-pointer" onClick={onFlip}>
      <div
        className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        {/* 앞면 — 단어 */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-surf border border-border rounded-2xl flex flex-col items-center justify-center gap-2 p-6">
          <span className="text-xs text-ink-faint uppercase tracking-wider">{word.language}</span>
          <span className="text-2xl font-bold text-ink text-center">{word.word}</span>
          <span className="text-xs text-ink-faint mt-2">{t('tapToFlip')}</span>
        </div>

        {/* 뒷면 — 뜻/예문 */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] bg-surf-2 border border-border rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <span className="text-lg font-semibold text-pri">{word.meaning}</span>
          {word.example_sentence && <p className="text-sm text-ink-dim leading-relaxed">{word.example_sentence}</p>}
        </div>
      </div>
    </div>
  );
}
