'use client';

import { SUPPORTED_LANGUAGES } from '@/lib/language-codes';
import type { AiRoadmap, Session } from '@/types';
import { MessageCircle, Play, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  isPro?: boolean;
  /** Preselects the language dropdown - defaults to the adopted roadmap's own target_language, but the user can still practice a different language for this one-off session (mobile parity). */
  defaultLanguage?: string | null;
  /** Recent sessions, used to derive scenarios already practiced so the AI suggestion doesn't repeat one. */
  sessions?: Session[];
  adoptedRoadmap?: AiRoadmap | null;
}

/** Titles created by useTutorSession are "{topic} — {aiTutorLabel}" - split off the label regardless of its (locale-dependent) text by taking everything before the last " — ". */
function extractRecentScenarios(sessions: Session[]): string[] {
  return sessions
    .filter((s) => s.title.includes(' — '))
    .slice(0, 15)
    .map((s) => {
      const parts = s.title.split(' — ');
      parts.pop();
      return parts.join(' — ').trim();
    })
    .filter(Boolean);
}

/** Lets the user pick their own roleplay language + scenario in free text (mobile parity) instead of only ever entering via CoachCard's AI-suggested topic in whatever language the adopted roadmap happens to be. */
export default function HomeRoleplayCard({ isPro = false, defaultLanguage, sessions = [], adoptedRoadmap }: Props) {
  const t = useTranslations('home');
  const router = useRouter();
  const locale = useLocale();
  const [scenario, setScenario] = useState('');
  const [language, setLanguage] = useState(
    defaultLanguage && SUPPORTED_LANGUAGES.includes(defaultLanguage) ? defaultLanguage : SUPPORTED_LANGUAGES[0]
  );
  const [suggestStatus, setSuggestStatus] = useState<'idle' | 'loading' | 'rateLimited' | 'error'>('idle');

  const handleStart = () => {
    const topic = scenario.trim();
    if (!topic) return;
    if (!isPro) {
      router.push(`/${locale}/dashboard/tutor?gate=true`);
      return;
    }
    router.push(`/${locale}/dashboard/tutor?topic=${encodeURIComponent(topic)}&lang=${encodeURIComponent(language)}`);
  };

  const handleSuggest = async () => {
    if (!isPro) {
      router.push(`/${locale}/dashboard/tutor?gate=true`);
      return;
    }
    setSuggestStatus('loading');
    try {
      const res = await fetch('/api/roleplay/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentScenarios: extractRecentScenarios(sessions),
          targetLanguage: language,
          goal: adoptedRoadmap?.goal ?? null,
          careerLevel: adoptedRoadmap?.career_level ?? null,
          locale,
        }),
      });
      if (res.status === 429) {
        setSuggestStatus('rateLimited');
        return;
      }
      if (!res.ok) {
        setSuggestStatus('error');
        return;
      }
      const data = await res.json();
      if (typeof data.scenario === 'string' && data.scenario.trim()) {
        setScenario(data.scenario.trim());
        setSuggestStatus('idle');
      } else {
        setSuggestStatus('error');
      }
    } catch {
      setSuggestStatus('error');
    }
  };

  return (
    <div className="bg-surf border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MessageCircle size={16} strokeWidth={1.8} className="text-pri" />
        <p className="text-xs font-bold text-ink uppercase tracking-wider">{t('roleplayTitle')}</p>
      </div>

      <p className="text-xs text-ink-faint">{t('roleplaySubtitle')}</p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-surf-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink outline-none focus:border-pri transition-colors"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

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
        onClick={handleSuggest}
        disabled={suggestStatus === 'loading'}
        className="flex items-center gap-1 text-xs text-pri hover:opacity-80 disabled:opacity-50 transition-opacity self-start"
      >
        <Sparkles size={12} strokeWidth={1.8} />
        {suggestStatus === 'loading' ? t('roleplaySuggestLoading') : t('roleplaySuggestCta')}
      </button>
      {suggestStatus === 'rateLimited' && <p className="text-xs text-amber">{t('rateLimited')}</p>}
      {suggestStatus === 'error' && <p className="text-xs text-red-400">{t('roleplaySuggestError')}</p>}

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
