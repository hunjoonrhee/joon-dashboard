'use client';

import { useTranslations } from 'next-intl';

export default function LandingFooter() {
  const t = useTranslations('landing');

  const links = [
    { labelKey: 'footerTerms' as const, href: '#' },
    { labelKey: 'footerPrivacy' as const, href: '#' },
    { labelKey: 'footerContact' as const, href: '#' },
  ];

  return (
    <footer className="border-t border-white/6 py-8 px-6 max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center text-xs">
          🧭
        </div>
        <span className="text-sm font-bold text-white">Growpath</span>
      </div>
      <div className="flex gap-5">
        {links.map((link) => (
          <a
            key={link.labelKey}
            href={link.href}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            {t(link.labelKey)}
          </a>
        ))}
      </div>
    </footer>
  );
}
