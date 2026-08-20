'use client';

import { Code2 } from 'lucide-react';
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
    <div className="border-t border-border px-4 py-3 flex gap-2 flex-shrink-0 bg-surf">
      <button
        onClick={onCodeReviewOpen}
        disabled={loading || isEndingSession}
        className="px-3 py-2 rounded-xl border border-border text-ink-faint hover:bg-surf-2 hover:border-pri hover:text-pri disabled:opacity-40 transition-colors flex-shrink-0"
        title="코드 리뷰 요청"
      >
        <Code2 size={15} />
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
        className="flex-1 bg-surf-2 border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri focus:bg-surf transition-colors disabled:opacity-40 resize-none overflow-hidden"
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
        className="px-4 py-2.5 rounded-xl bg-pri text-on-pri text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('send')}
      </button>
    </div>
  );
}
