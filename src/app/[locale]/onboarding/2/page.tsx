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
    'w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-gray-700" />
        </div>
        <p className="text-xs text-gray-500 mb-1">{t('step2of3')}</p>
        <h2 className="text-xl font-bold text-white mb-2">{t('step2Title')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('step2Sub')}</p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">{t('goalLabel')}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t('goalPlaceholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">{t('levelLabel')}</label>
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
            className="px-5 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            {t('backBtn')}
          </button>
          <button
            onClick={handleNext}
            disabled={!goal.trim() || !level.trim()}
            className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-sm font-bold text-white transition-colors"
          >
            {t('generateBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
