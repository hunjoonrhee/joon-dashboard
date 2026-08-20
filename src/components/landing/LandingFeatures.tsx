'use client';

import { BarChart2, Bot, GraduationCap, Route, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  isPro?: boolean;
}

const FEATURES: Feature[] = [
  { icon: Route, titleKey: 'feat1Title', descKey: 'feat1Desc' },
  { icon: BarChart2, titleKey: 'feat2Title', descKey: 'feat2Desc' },
  { icon: Bot, titleKey: 'feat3Title', descKey: 'feat3Desc' },
  { icon: GraduationCap, titleKey: 'feat4Title', descKey: 'feat4Desc', isPro: true },
];

export default function LandingFeatures() {
  const t = useTranslations('landing');

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-widest uppercase text-pri mb-3">{t('featEyebrow')}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">{t('featTitle')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((feat) => (
          <div
            key={feat.titleKey}
            className={`bg-surf border border-border rounded-2xl p-5 ${feat.isPro ? 'border-pri/20' : ''}`}
          >
            <div className="w-10 h-10 bg-pri/10 rounded-xl flex items-center justify-center mb-4">
              <feat.icon size={19} strokeWidth={1.8} className="text-pri" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-ink">{t(feat.titleKey)}</h3>
              {feat.isPro && (
                <span className="text-[10px] font-bold bg-amber text-on-pri px-2 py-0.5 rounded-full">
                  {t('feat4Pro')}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-faint leading-relaxed">{t(feat.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
