'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { QuizData } from '../hooks/useTutorSession';

interface Props {
  quiz: QuizData;
  selectedOption?: number;
  onSelect: (optIdx: number) => void;
}

export default function TutorQuiz({ quiz, selectedOption, onSelect }: Props) {
  const t = useTranslations('tutor');

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <p className="text-[10px] font-semibold text-amber-600 mb-2 uppercase tracking-wider">{t('quizLabel')}</p>
      <p className="text-sm text-amber-900 font-medium mb-3">{quiz.question}</p>
      <div className="flex flex-col gap-1.5">
        {quiz.options.map((opt, optIdx) => {
          const selected = selectedOption !== undefined;
          const isSelected = selectedOption === optIdx;
          const isCorrect = optIdx === quiz.correct;
          let cls =
            'flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border cursor-pointer transition-colors text-left ';
          if (!selected) cls += 'bg-white border-amber-200 text-amber-800 hover:bg-amber-100';
          else if (isCorrect) cls += 'bg-green-50 border-green-200 text-green-800';
          else if (isSelected) cls += 'bg-red-50 border-red-200 text-red-700';
          else cls += 'bg-white border-border text-ink-faint';

          return (
            <button key={optIdx} className={cls} onClick={() => !selected && onSelect(optIdx)} disabled={selected}>
              {isCorrect && selected && <Check size={12} className="flex-shrink-0" />}
              {isSelected && !isCorrect && <X size={12} className="flex-shrink-0" />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
