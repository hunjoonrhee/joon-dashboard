'use client';

import { useGuardedAction } from '@/hooks/useGuardedNavigate';
import { navItems } from '@/lib/nav-items';
import { supabase } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useTimerStore } from '@/store/timerStore';
import { LogOut, Settings, Timer, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const tTimer = useTranslations('timer');
  const locale = useLocale();
  const [name, setName] = useState('J');
  const [dateStr, setDateStr] = useState('');
  const { status: timerStatus, start: startTimer } = useTimerStore();

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'name')
      .single()
      .then(({ data }: { data: { value: string } | null }) => {
        if (data?.value) setName(data.value);
      });
    setDateStr(
      new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'ko' ? 'ko-KR' : 'en-US', {
        timeZone: 'Europe/Berlin',
      })
    );
  }, []);

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    return pathname === fullPath || pathname.startsWith(`/${locale}${path}/`);
  };

  const guard = useGuardedAction();
  const navigate = (path: string) => guard(() => router.push(`/${locale}${path}`));

  const switchLocale = (newLocale: string) =>
    guard(() => {
      const segments = pathname.split('/');
      segments[1] = newLocale;
      router.push(segments.join('/'));
    });

  const handleSignOut = () =>
    guard(async () => {
      const client = createSupabaseBrowserClient();
      await client.auth.signOut();
      router.push(`/${locale}/login`);
    });

  return (
    <>
      {/* 모바일 하단 탭 */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-surf border-t border-border z-10 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                active ? 'text-pri' : 'text-ink-faint'
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>{t(item.key)}</span>
            </button>
          );
        })}
      </div>

      {/* 모바일 상단 헤더 */}
      <div className="lg:hidden bg-surf border-b border-border h-12 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="Growpath" className="w-6 h-6 rounded-lg" />
          <span className="text-sm font-bold text-ink">Growpath</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-surf-2 rounded-lg p-0.5">
            {(['ko', 'de', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  locale === l ? 'bg-surf text-ink font-semibold shadow-sm' : 'text-ink-faint'
                }`}
              >
                {l === 'ko' ? '한' : l === 'de' ? 'DE' : 'EN'}
              </button>
            ))}
          </div>
          {timerStatus === 'idle' && (
            <button
              onClick={() => startTimer()}
              aria-label={tTimer('start')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surf-2 transition-colors"
            >
              <Timer size={16} />
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard/achievements')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surf-2 transition-colors"
          >
            <Trophy size={16} />
          </button>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surf-2 transition-colors"
          >
            <Settings size={17} />
          </button>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-faint hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
