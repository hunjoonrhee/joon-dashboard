'use client';

import type { PronunciationResult } from '@/lib/azure-pronunciation';
import { Code2, Mic, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface Props {
  loading: boolean;
  isEndingSession: boolean;
  languageCode: string | null;
  onSend: (text: string, pronunciation?: PronunciationResult) => void;
  onCodeReviewOpen: () => void;
}

export default function TutorInput({ loading, isEndingSession, languageCode, onSend, onCodeReviewOpen }: Props) {
  const t = useTranslations('tutor');
  const [input, setInput] = useState('');
  // The transcript as it arrived from STT, so we can tell if the user edited
  // it before sending - editing means the pronunciation score no longer
  // matches what's actually being sent, so it gets dropped.
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [pendingPronunciation, setPendingPronunciation] = useState<PronunciationResult | null>(null);
  const recorder = useVoiceRecorder(languageCode);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const pronunciation = input === pendingTranscript ? (pendingPronunciation ?? undefined) : undefined;
    onSend(input.trim(), pronunciation);
    setInput('');
    setPendingTranscript(null);
    setPendingPronunciation(null);
  };

  const handleMicClick = async () => {
    if (recorder.status === 'idle') {
      await recorder.start();
      return;
    }
    if (recorder.status === 'recording') {
      const result = await recorder.stop();
      if (result?.transcript) {
        setInput(result.transcript);
        setPendingTranscript(result.transcript);
        setPendingPronunciation(result.pronunciation);
      }
    }
  };

  const micBusy = recorder.status === 'transcribing' || recorder.status === 'scoring';

  return (
    <div className="border-t border-border px-4 py-3 flex flex-col gap-2 flex-shrink-0 bg-surf">
      {recorder.status !== 'idle' && (
        <p className="text-xs text-ink-faint flex items-center gap-1.5">
          {recorder.status === 'recording' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {t('recording')}
            </>
          )}
          {recorder.status === 'transcribing' && t('transcribing')}
          {recorder.status === 'scoring' && t('scoringPronunciation')}
          {recorder.status === 'error' && <span className="text-red-400">{t('voiceError')}</span>}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCodeReviewOpen}
          disabled={loading || isEndingSession}
          className="px-3 py-2 rounded-xl border border-border text-ink-faint hover:bg-surf-2 hover:border-pri hover:text-pri disabled:opacity-40 transition-colors flex-shrink-0"
          title="코드 리뷰 요청"
        >
          <Code2 size={15} />
        </button>
        {languageCode && (
          <button
            onClick={handleMicClick}
            disabled={loading || isEndingSession || micBusy}
            className={`px-3 py-2 rounded-xl border transition-colors flex-shrink-0 disabled:opacity-40 ${
              recorder.status === 'recording'
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'border-border text-ink-faint hover:bg-surf-2 hover:border-pri hover:text-pri'
            }`}
            title={t('voiceInput')}
          >
            {recorder.status === 'recording' ? <Square size={15} /> : <Mic size={15} />}
          </button>
        )}
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
    </div>
  );
}
