'use client';

import { Compass } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function LandingFooter() {
  const t = useTranslations('landing');
  const locale = useLocale();

  const links = [
    { labelKey: 'footerTerms' as const, href: `/${locale}/terms` },
    { labelKey: 'footerPrivacy' as const, href: `/${locale}/privacy` },
    { labelKey: 'footerContact' as const, href: '#' },
  ];

  return (
    <footer className="border-t border-border py-8 px-6 max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-pri rounded-md flex items-center justify-center text-on-pri">
          <Compass size={12} strokeWidth={1.8} />
        </div>
        <span className="text-sm font-bold text-ink">Growpath</span>
      </div>
      <div className="flex gap-5">
        {links.map((link) => (
          <a key={link.labelKey} href={link.href} className="text-xs text-ink-faint hover:text-ink-dim transition-colors">
            {t(link.labelKey)}
          </a>
        ))}
      </div>
    </footer>
  );
}
