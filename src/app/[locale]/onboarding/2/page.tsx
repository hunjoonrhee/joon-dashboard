'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Onboarding2() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');

  const handleNext = () => {
    if (!goal.trim() || !level.trim()) return;
    sessionStorage.setItem('ob_goal', goal.trim());
    sessionStorage.setItem('ob_level', level.trim());
    router.push(`/${locale}/onboarding/3`);
  };

  const inputCls =
    'w-full bg-surf-2 border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri transition-colors';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-border" />
        </div>
        <p className="text-xs text-ink-faint mb-1">{t('step2of3')}</p>
        <h2 className="text-xl font-bold text-ink mb-2">{t('step2Title')}</h2>
        <p className="text-sm text-ink-faint mb-6">{t('step2Sub')}</p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs text-ink-dim mb-2 block">{t('goalLabel')}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t('goalPlaceholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-2 block">{t('levelLabel')}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t('levelPlaceholder')}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNext();
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/${locale}/onboarding/1`)}
            className="px-5 py-3 rounded-xl border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('backBtn')}
          </button>
          <button
            onClick={handleNext}
            disabled={!goal.trim() || !level.trim()}
            className="flex-1 py-3 rounded-xl bg-pri hover:opacity-90 disabled:opacity-40 text-sm font-bold text-on-pri transition-colors"
          >
            {t('generateBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
