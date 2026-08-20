'use client';

import { Check, Crown, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TutorGate() {
  const t = useTranslations('tutor');
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surf border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-surf-2 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={20} className="text-pri" />
        </div>
        <h1 className="text-base font-bold text-ink mb-2">{t('proGateTitle')}</h1>
        <p className="text-xs text-ink-dim leading-relaxed mb-5">{t('proGateSub')}</p>
        <ul className="text-left flex flex-col gap-2 mb-6">
          {[t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')].map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-ink-dim">
              <Check size={13} className="text-pri flex-shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <button className="w-full py-2.5 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 transition-colors mb-2 flex items-center justify-center gap-1.5">
          <Crown size={14} />
          {t('upgrade')}
        </button>
        <p className="text-xs text-ink-faint">{t('upgradePrice')}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs text-ink-faint hover:text-ink-dim transition-colors"
        >
          {t('backBtn')}
        </button>
      </div>
    </main>
  );
}
