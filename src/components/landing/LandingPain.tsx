'use client';

import { BookOpen, Frown, Repeat, Target, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PainItem {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

const PAIN_ITEMS: PainItem[] = [
  { icon: Frown, titleKey: 'pain1Title', descKey: 'pain1Desc' },
  { icon: BookOpen, titleKey: 'pain2Title', descKey: 'pain2Desc' },
  { icon: Target, titleKey: 'pain3Title', descKey: 'pain3Desc' },
  { icon: Repeat, titleKey: 'pain4Title', descKey: 'pain4Desc' },
];

export default function LandingPain() {
  const t = useTranslations('landing');

  return (
    <section className="max-w-3xl mx-auto px-6 py-20 text-center">
      <p className="text-xs font-bold tracking-widest uppercase text-pri mb-3">{t('painEyebrow')}</p>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-3">{t('painTitle')}</h2>
      <p className="text-ink-faint text-sm mb-10">{t('painSub')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {PAIN_ITEMS.map((item) => (
          <div key={item.titleKey} className="bg-surf border border-border rounded-2xl p-5">
            <item.icon size={22} strokeWidth={1.8} className="text-pri mb-3" />
            <h3 className="text-sm font-bold text-ink mb-1.5">{t(item.titleKey)}</h3>
            <p className="text-xs text-ink-faint leading-relaxed">{t(item.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
