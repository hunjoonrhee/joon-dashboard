'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LandingNav() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-8 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2.5">
        <img src="/icon.svg" alt="Growpath" className="w-7 h-7 rounded-lg" />
        <span className="text-sm font-bold text-ink">Growpath</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/${locale}/login`)}
          className="px-4 py-2 rounded-lg border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
        >
          {t('login')}
        </button>
        <button
          onClick={() => router.push(`/${locale}/signup`)}
          className="px-4 py-2 rounded-lg bg-pri text-sm font-semibold text-on-pri hover:opacity-90 transition-colors"
        >
          {t('start')}
        </button>
      </div>
    </nav>
  );
}
