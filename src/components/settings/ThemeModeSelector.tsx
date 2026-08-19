'use client';

import { useThemeMode, type ThemeMode } from '@/lib/theme-context';
import { useTranslations } from 'next-intl';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export default function ThemeModeSelector() {
  const { mode, setMode } = useThemeMode();
  const t = useTranslations('settings');

  return (
    <div className="flex gap-1 bg-surf-2 rounded-xl p-1">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
            mode === m ? 'bg-pri/15 text-pri border-pri' : 'bg-transparent text-ink-dim border-transparent'
          }`}
        >
          {t(`theme.${m}`)}
        </button>
      ))}
    </div>
  );
}
