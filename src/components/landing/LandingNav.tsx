'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LandingNav() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-8 bg-gray-950/80 backdrop-blur-md border-b border-white/6">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">🧭</div>
        <span className="text-sm font-bold text-white">Growpath</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/${locale}/login`)}
          className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors"
        >
          {t('login')}
        </button>
        <button
          onClick={() => router.push(`/${locale}/signup`)}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          {t('start')}
        </button>
      </div>
    </nav>
  );
}
