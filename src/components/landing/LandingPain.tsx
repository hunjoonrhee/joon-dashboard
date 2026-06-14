'use client';

import { useTranslations } from 'next-intl';

interface PainItem {
  icon: string;
  titleKey: keyof ReturnType<typeof useTranslations<'landing'>>;
  descKey: keyof ReturnType<typeof useTranslations<'landing'>>;
}

const PAIN_ITEMS: PainItem[] = [
  { icon: '😵', titleKey: 'pain1Title', descKey: 'pain1Desc' },
  { icon: '📚', titleKey: 'pain2Title', descKey: 'pain2Desc' },
  { icon: '🎯', titleKey: 'pain3Title', descKey: 'pain3Desc' },
  { icon: '🔁', titleKey: 'pain4Title', descKey: 'pain4Desc' },
];

export default function LandingPain() {
  const t = useTranslations('landing');

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">
        {t('painEyebrow')}
      </p>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
        {t('painTitle')}
      </h2>
      <p className="text-gray-400 text-sm mb-10">{t('painSub')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {PAIN_ITEMS.map((item) => (
          <div
            key={item.titleKey}
            className="bg-gray-900 border border-white/6 rounded-2xl p-5"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="text-sm font-bold text-white mb-1.5">
              {t(item.titleKey)}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t(item.descKey)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
