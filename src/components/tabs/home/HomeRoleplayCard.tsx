'use client';

import { MessageCircle, Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  isPro?: boolean;
}

/** Lets the user pick their own roleplay scenario in free text (mobile parity) instead of only ever entering via CoachCard's AI-suggested topic. */
export default function HomeRoleplayCard({ isPro = false }: Props) {
  const t = useTranslations('home');
  const router = useRouter();
  const locale = useLocale();
  const [scenario, setScenario] = useState('');

  const handleStart = () => {
    const topic = scenario.trim();
    if (!topic) return;
    if (!isPro) {
      router.push(`/${locale}/dashboard/tutor?gate=true`);
      return;
    }
    router.push(`/${locale}/dashboard/tutor?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="bg-surf border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageCircle size={16} strokeWidth={1.8} className="text-pri" />
        <p className="text-xs font-bold text-ink uppercase tracking-wider">{t('roleplayTitle')}</p>
      </div>

      <p className="text-xs text-ink-faint">{t('roleplaySubtitle')}</p>

      <textarea
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleStart();
          }
        }}
        placeholder={t('roleplayScenarioPlaceholder')}
        rows={2}
        className="flex-1 bg-surf-2 border border-border rounded-xl px-3 py-2 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri focus:bg-surf transition-colors resize-none"
      />

      <button
        onClick={handleStart}
        disabled={!scenario.trim()}
        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-pri text-on-pri text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-start"
      >
        <Play size={11} fill="currentColor" /> {t('roleplayStart')}
        {!isPro && <span className="ml-1 bg-white/20 text-on-pri text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>}
      </button>
    </div>
  );
}
