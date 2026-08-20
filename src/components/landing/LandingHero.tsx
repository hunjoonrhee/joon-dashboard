'use client';

import { Code2, Gift, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

function BetaStats() {
  const t = useTranslations('landing');
  const stats = [
    { label: t('betaNote'), icon: Sparkles },
    { label: t('betaStory'), icon: Code2 },
    { label: t('betaFree'), icon: Gift },
  ] as const;

  return (
    <div className="flex gap-6 justify-center flex-wrap mt-8">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 text-xs text-ink-faint">
          <s.icon size={13} strokeWidth={1.8} />
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pri/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pri/10 border border-pri/20 text-pri text-xs font-semibold mb-6">
          <Sparkles size={12} strokeWidth={1.8} /> {t('badge')}
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-ink mb-4">
          {t('headline1')}
          <br />
          <span className="text-pri">{t('headline2')}</span>
        </h1>

        <p className="text-ink-faint text-base leading-relaxed mb-8 max-w-md mx-auto">{t('sub')}</p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/try`)}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-pri font-semibold text-sm text-on-pri hover:opacity-90 transition-colors"
          >
            <Sparkles size={14} strokeWidth={1.8} /> {t('cta')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-6 py-3 rounded-xl border border-border text-ink-dim text-sm hover:bg-surf-2 transition-colors"
          >
            {t('login')}
          </button>
        </div>

        <BetaStats />
      </div>
    </section>
  );
}
