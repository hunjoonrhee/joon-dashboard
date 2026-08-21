'use client';

import { navItems } from '@/lib/nav-items';
import { supabase } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { LogOut, Settings, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] ?? 'ko';
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('Joon');
  const [role, setRole] = useState('');

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .then(({ data }: { data: { key: string; value: string }[] | null }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((s: { key: string; value: string }) => {
            map[s.key] = s.value;
          });
          if (map.name) setName(map.name);
          if (map.big_goal_sub) setRole(map.big_goal_sub);
        }
      });
  }, []);

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    if (path === '/dashboard') return pathname === fullPath;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const navigate = (path: string) => router.push(`/${locale}${path}`);

  const handleSignOut = async () => {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <aside className="w-56 bg-surf border-r border-border fixed top-0 left-0 h-screen flex flex-col z-20 hidden lg:flex">
      <div
        className="flex items-center gap-2.5 px-5 h-[57px] border-b border-border cursor-pointer hover:bg-surf-2 transition-colors"
        onClick={() => navigate('/dashboard')}
      >
        <img src="/icon.svg" alt="Growpath" className="w-7 h-7 rounded-lg" />
        <span className="text-sm font-bold text-ink">Growpath</span>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-colors ${
                active ? 'bg-surf-2 text-pri' : 'text-ink-dim hover:bg-surf-2 hover:text-ink'
              }`}
            >
              <Icon size={18} strokeWidth={1.8} className="flex-shrink-0" />
              <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>{t(item.key)}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-6 h-[57px] rounded-xl hover:bg-surf-2 cursor-pointer mb-1">
          <div className="w-7 h-7 rounded-full bg-pri flex items-center justify-center text-xs font-bold text-on-pri flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{name}</div>
            {role && <div className="text-xs text-ink-faint truncate">{role}</div>}
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/achievements')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink-faint hover:text-ink hover:bg-surf-2 w-full transition-colors"
        >
          <Trophy size={15} />
          <span className="text-sm">{t('achievements')}</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/settings')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink-faint hover:text-ink hover:bg-surf-2 w-full transition-colors"
        >
          <Settings size={15} />
          <span className="text-sm">{t('settings')}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-ink-faint hover:text-red-500 hover:bg-red-50 w-full transition-colors mt-0.5"
        >
          <LogOut size={15} />
          <span className="text-sm">{tCommon('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
