'use client';

import { useTranslations } from 'next-intl';

interface Feature {
  icon: string;
  iconBg: string;
  titleKey: string; // 변경
  descKey: string; // 변경
  isPro?: boolean;
}

const FEATURES: Feature[] = [
  { icon: '🗺️', iconBg: 'bg-indigo-500/10', titleKey: 'feat1Title', descKey: 'feat1Desc' },
  { icon: '📊', iconBg: 'bg-green-500/10', titleKey: 'feat2Title', descKey: 'feat2Desc' },
  { icon: '🤖', iconBg: 'bg-amber-500/10', titleKey: 'feat3Title', descKey: 'feat3Desc' },
  { icon: '👨‍🏫', iconBg: 'bg-blue-500/10', titleKey: 'feat4Title', descKey: 'feat4Desc', isPro: true },
];

export default function LandingFeatures() {
  const t = useTranslations('landing');

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">{t('featEyebrow')}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{t('featTitle')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((feat) => (
          <div
            key={feat.titleKey}
            className={`bg-gray-900 border border-white/6 rounded-2xl p-5 ${feat.isPro ? 'border-indigo-500/20' : ''}`}
          >
            <div className={`w-10 h-10 ${feat.iconBg} rounded-xl flex items-center justify-center text-xl mb-4`}>
              {feat.icon}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-white">{t(feat.titleKey)}</h3>
              {feat.isPro && (
                <span className="text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                  {t('feat4Pro')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{t(feat.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
