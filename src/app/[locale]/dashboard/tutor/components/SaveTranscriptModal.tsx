'use client';

import { useTranslations } from 'next-intl';

interface Props {
  onChoose: (saveTranscript: boolean) => void;
}

/** Asks whether to keep the full chat transcript on the saved session record - added after
 * feedback that every AI tutor session (roleplay included) was silently saving the whole
 * conversation every time, with no way to opt out. */
export default function SaveTranscriptModal({ onChoose }: Props) {
  const t = useTranslations('tutor');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surf border border-border rounded-2xl p-6 max-w-sm w-full">
        <h2 className="text-base font-bold text-ink mb-2">{t('saveTranscriptTitle')}</h2>
        <p className="text-sm text-ink-dim mb-5">{t('saveTranscriptSub')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => onChoose(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('saveTranscriptDecline')}
          </button>
          <button
            onClick={() => onChoose(true)}
            className="flex-1 py-2.5 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 transition-colors"
          >
            {t('saveTranscriptAccept')}
          </button>
        </div>
      </div>
    </div>
  );
}
