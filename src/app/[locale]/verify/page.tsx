'use client';

import { useTranslations } from 'next-intl';

export default function VerifyPage() {
  const t = useTranslations('verify');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-5">📬</div>
        <h1 className="text-xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-6 whitespace-pre-line">{t('sub')}</p>
        <p className="text-xs text-gray-600">{t('spam')}</p>
      </div>
    </div>
  );
}
