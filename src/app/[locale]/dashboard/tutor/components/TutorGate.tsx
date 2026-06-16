'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TutorGate() {
  const t = useTranslations('tutor');
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✨
        </div>
        <h1 className="text-base font-bold text-gray-900 mb-2">{t('proGateTitle')}</h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">{t('proGateSub')}</p>
        <ul className="text-left flex flex-col gap-2 mb-6">
          {[t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')].map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-indigo-500">✓</span> {f}
            </li>
          ))}
        </ul>
        <button className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors mb-2">
          👑 {t('upgrade')}
        </button>
        <p className="text-xs text-gray-400">{t('upgradePrice')}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t('backBtn')}
        </button>
      </div>
    </main>
  );
}
