'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

function BetaStats() {
  const t = useTranslations('landing');
  const stats = [
    { label: t('betaNote'), icon: '✦' },
    { label: t('betaStory'), icon: '👨‍💻' },
    { label: t('betaFree'), icon: '🎉' },
  ] as const;

  return (
    <div className="flex gap-6 justify-center flex-wrap mt-8">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LandingHero() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
      {/* glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          ✦ {t('badge')}
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4">
          {t('headline1')}
          <br />
          <span className="text-indigo-400">{t('headline2')}</span>
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md mx-auto">
          {t('sub')}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/try`)}
            className="px-6 py-3 rounded-xl bg-indigo-500 font-semibold text-sm text-white hover:bg-indigo-600 transition-colors"
          >
            ✦ {t('cta')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            {t('login')}
          </button>
        </div>

        <BetaStats />
      </div>
    </section>
  );
}
