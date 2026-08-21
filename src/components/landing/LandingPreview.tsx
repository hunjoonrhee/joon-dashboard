'use client';

import { useTranslations } from 'next-intl';

function PreviewBar() {
  return (
    <div className="bg-surf-2 px-4 py-2.5 flex items-center gap-2 border-b border-border rounded-t-2xl">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-pri/70" />
      <div className="flex-1 bg-surf rounded-md py-1 px-3 text-xs text-ink-faint text-center">
        growpath.app/dashboard
      </div>
    </div>
  );
}

export default function LandingPreview() {
  const t = useTranslations('landing');

  return (
    <div className="max-w-3xl mx-auto px-6 mb-20">
      <p className="text-center text-xs font-semibold text-ink-faint uppercase tracking-widest mb-4">
        {t('previewLabel')}
      </p>
      <div className="bg-surf border border-border rounded-2xl overflow-hidden shadow-2xl shadow-pri/5">
        <PreviewBar />
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image doesn't preserve GIF animation without `unoptimized`, and this is a static public asset, not a remote/optimizable one */}
        <img src="/growpath-demo.gif" alt={t('previewLabel')} className="w-full block" />
      </div>
    </div>
  );
}
