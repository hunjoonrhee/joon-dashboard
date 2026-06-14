'use client';

import AddSessionModal from '@/components/AddSessionModal';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import GoalModal from '@/components/tabs/roadmap/GoalModal';
import { ToastProvider } from '@/components/Toast';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useModalStore } from '@/store/modalStore';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  // /ko/dashboard/study → segment = 'study'
  // /ko/dashboard → segment = ''
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] ?? 'ko';
  const segment = pathname.split('/')[3] ?? '';

  const pageTitles: Record<string, string> = {
    '': tNav('home'),
    study: tNav('study'),
    notes: tNav('notes'),
    roadmap: tNav('roadmap'),
    projects: tNav('projects'),
    settings: tNav('settings'),
  };

  const pageTitle = pageTitles[segment] ?? '';

  const today =
    typeof window !== 'undefined'
      ? new Date().toLocaleDateString(
          locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
        )
      : '';

  const headerButtonConfig: Record<
    string,
    { label: string; modal: 'study' | 'goal' | 'project' | false }
  > = {
    '': { label: `+ ${tNav('study')}`, modal: 'study' },
    study: { label: `+ ${tNav('study')}`, modal: 'study' },
    notes: { label: `+ ${tCommon('add')} ${tNav('notes')}`, modal: false },
    roadmap: { label: `+ ${tNav('goals')}`, modal: 'goal' },
    projects: { label: `+ ${tNav('projects')}`, modal: 'project' },
    settings: { label: `+ ${tNav('study')}`, modal: 'study' },
  };

  const { studyModalOpen, openStudyModal, closeStudyModal } = useModalStore();
  const [showGoalModal, setShowGoalModal] = useState(false);

  const btnConfig = headerButtonConfig[segment] ?? headerButtonConfig[''];

  const handleHeaderBtn = () => {
    if (btnConfig.modal === 'study') openStudyModal();
    else if (btnConfig.modal === 'goal') setShowGoalModal(true);
    else if (btnConfig.modal === 'project') router.push(pathname + '?add=true');
  };

  const handleSignOut = async () => {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
          <NavBar />
          <div className="hidden lg:flex items-center justify-between px-6 h-[57px] bg-white border-b border-gray-100 sticky top-0 z-10">
            <h1 className="text-base font-bold text-gray-800">{pageTitle}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400" suppressHydrationWarning>
                {today}
              </span>
              <button
                onClick={handleHeaderBtn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
              >
                {btnConfig.label}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {tCommon('logout')}
              </button>
            </div>
          </div>
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>

        {studyModalOpen && (
          <AddSessionModal
            onClose={closeStudyModal}
            onSaved={closeStudyModal}
          />
        )}

        {showGoalModal && (
          <GoalModal
            mode="add"
            onClose={() => setShowGoalModal(false)}
            onSaved={() => setShowGoalModal(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
