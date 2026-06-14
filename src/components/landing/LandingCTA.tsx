'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LandingCTA() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <section className="relative py-24 text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">{t('ctaTitle')}</h2>
        <p className="text-gray-400 text-sm mb-8">{t('ctaSub')}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/try`)}
            className="px-6 py-3 rounded-xl bg-indigo-500 font-semibold text-sm text-white hover:bg-indigo-600 transition-colors"
          >
            ✦ {t('cta')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </div>
    </section>
  );
}
