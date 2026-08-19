'use client';

import { Code2, Globe, Music, PenLine } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Onboarding1() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const stages = sessionStorage.getItem('ob_stages');
    if (stages) {
      router.replace(`/${locale}/onboarding/3`);
    }
  }, []);

  const domains = [
    { key: 'dev', icon: Code2, label: t('domain1Label'), sub: t('domain1Sub') },
    { key: 'lang', icon: Globe, label: t('domain2Label'), sub: t('domain2Sub') },
    { key: 'music', icon: Music, label: t('domain3Label'), sub: t('domain3Sub') },
    { key: 'custom', icon: PenLine, label: t('domain4Label'), sub: t('domain4Sub') },
  ];

  const handleNext = () => {
    if (!selected) return;
    sessionStorage.setItem('ob_domain', selected);
    router.push(`/${locale}/onboarding/2`);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-border" />
          <div className="flex-1 h-1 rounded-full bg-border" />
        </div>
        <p className="text-xs text-ink-faint mb-1">{t('step1of3')}</p>
        <h2 className="text-xl font-bold text-ink mb-6">{t('step1Title')}</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {domains.map((d) => {
            const Icon = d.icon;
            const active = selected === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setSelected(d.key)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  active ? 'border-pri bg-pri/10' : 'border-border bg-surf-2 hover:border-pri/40'
                }`}
              >
                <Icon size={22} strokeWidth={1.8} className={active ? 'text-pri mb-2' : 'text-ink-dim mb-2'} />
                <div className="text-sm font-semibold text-ink mb-0.5">{d.label}</div>
                <div className={`text-xs ${active ? 'text-pri' : 'text-ink-faint'}`}>{d.sub}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={!selected}
          className="w-full py-3 rounded-xl bg-pri hover:opacity-90 disabled:opacity-40 text-sm font-bold text-on-pri transition-colors"
        >
          {t('nextBtn')}
        </button>
      </div>
    </div>
  );
}
