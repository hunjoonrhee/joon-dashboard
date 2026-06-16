'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Props {
  loading: boolean;
  isEndingSession: boolean;
  onSend: (text: string) => void;
  onCodeReviewOpen: () => void;
}

export default function TutorInput({ loading, isEndingSession, onSend, onCodeReviewOpen }: Props) {
  const t = useTranslations('tutor');
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="border-t border-gray-100 px-4 py-3 flex gap-2 flex-shrink-0 bg-white">
      <button
        onClick={onCodeReviewOpen}
        disabled={loading || isEndingSession}
        className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 transition-colors flex-shrink-0"
        title="코드 리뷰 요청"
      >
        {'</>'}
      </button>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={t('inputPlaceholder')}
        disabled={isEndingSession}
        rows={1}
        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-300 focus:bg-white transition-colors disabled:opacity-40 resize-none overflow-hidden"
        style={{ minHeight: '42px', maxHeight: '120px' }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || loading || isEndingSession}
        className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('send')}
      </button>
    </div>
  );
}
