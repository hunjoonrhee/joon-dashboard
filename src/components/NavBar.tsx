'use client';

import { supabase } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const tabs = [
  { key: 'home', path: '/dashboard', icon: '🏠' },
  { key: 'study', path: '/dashboard/study', icon: '📖' },
  { key: 'notes', path: '/dashboard/notes', icon: '✍️' },
  { key: 'roadmap', path: '/dashboard/roadmap', icon: '🗺' },
  { key: 'projects', path: '/dashboard/projects', icon: '🚀' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const locale = pathname.split('/')[1] ?? 'ko';
  const [name, setName] = useState('J');
  const [dateStr, setDateStr] = useState('');

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

  const navigate = (path: string) => router.push(`/${locale}${path}`);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const handleSignOut = async () => {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <>
      {/* 모바일 하단 탭 */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isActive(tab.path) ? 'text-indigo-500' : 'text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={`text-xs ${isActive(tab.path) ? 'font-bold' : 'font-medium'}`}>{t(tab.key)}</span>
          </button>
        ))}
      </div>

      {/* 모바일 상단 헤더 */}
      <div className="lg:hidden bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-xs">🧭</div>
          <span className="text-sm font-bold text-gray-800">Growpath</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(['ko', 'de', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  locale === l ? 'bg-white text-gray-800 font-semibold shadow-sm' : 'text-gray-400'
                }`}
              >
                {l === 'ko' ? '한' : l === 'de' ? 'DE' : 'EN'}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={17} />
          </button>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
          >
            ⎋
          </button>
        </div>
      </div>
    </>
  );
}
