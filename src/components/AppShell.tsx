'use client';

import AddSessionModal from '@/components/AddSessionModal';
import { CelebrationOverlay } from '@/components/celebration/CelebrationOverlay';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import GoalModal from '@/components/tabs/roadmap/GoalModal';
import TimerBar from '@/components/timer/TimerBar';
import { ToastProvider } from '@/components/Toast';
import LeaveSessionGuardModal from '@/components/tutor/LeaveSessionGuardModal';
import { useGuardedAction } from '@/hooks/useGuardedNavigate';
import { CelebrationProvider } from '@/lib/celebration-context';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useModalStore } from '@/store/modalStore';
import { useTimerStore } from '@/store/timerStore';
import { Timer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tAchievements = useTranslations('achievements');
  const tTimer = useTranslations('timer');

  // /ko/dashboard/study → segment = 'study'
  // /ko/dashboard → segment = ''
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const segment = pathname.split('/')[3] ?? '';
  // The AI tutor page already tracks its own elapsed time per session (shown
  // in its own header) - offering the standalone study timer's start button
  // there too would let two unrelated timers run at once for no reason.
  const isTutorPage = segment === 'tutor';

  const pageTitles: Record<string, string> = {
    '': tNav('home'),
    study: tNav('study'),
    notes: tNav('notes'),
    roadmap: tNav('roadmap'),
    projects: tNav('projects'),
    settings: tNav('settings'),
    achievements: tAchievements('title'),
  };

  const pageTitle = pageTitles[segment] ?? '';

  const today =
    typeof window !== 'undefined'
      ? new Date().toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })
      : '';

  const headerButtonConfig: Record<string, { label: string; modal: 'study' | 'goal' | 'project' | false }> = {
    '': { label: `+ ${tNav('study')}`, modal: 'study' },
    study: { label: `+ ${tNav('study')}`, modal: 'study' },
    notes: { label: `+ ${tCommon('add')} ${tNav('notes')}`, modal: false },
    roadmap: { label: `+ ${tNav('goals')}`, modal: 'goal' },
    projects: { label: `+ ${tNav('projects')}`, modal: 'project' },
    settings: { label: `+ ${tNav('study')}`, modal: 'study' },
  };

  const { studyModalOpen, studyModalInitialTitle, studyModalInitialDurationMinutes, openStudyModal, closeStudyModal } =
    useModalStore();
  const { status: timerStatus, start: startTimer } = useTimerStore();
  const [showGoalModal, setShowGoalModal] = useState(false);

  const btnConfig = headerButtonConfig[segment] ?? headerButtonConfig[''];
  const guard = useGuardedAction();

  const handleHeaderBtn = () => {
    if (btnConfig.modal === 'study') openStudyModal();
    else if (btnConfig.modal === 'goal') setShowGoalModal(true);
    else if (btnConfig.modal === 'project') guard(() => router.push(pathname + '?add=true'));
  };

  const handleSignOut = () =>
    guard(async () => {
      const client = createSupabaseBrowserClient();
      await client.auth.signOut();
      router.push(`/${locale}/login`);
    });

  return (
    <ToastProvider>
      <CelebrationProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
            <NavBar />
            <div className="hidden lg:flex items-center justify-between px-6 h-[57px] bg-surf border-b border-border sticky top-0 z-10">
              <h1 className="text-base font-bold text-ink">{pageTitle}</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink-faint" suppressHydrationWarning>
                  {today}
                </span>
                {timerStatus === 'idle' && !isTutorPage && (
                  <button
                    onClick={() => startTimer()}
                    aria-label={tTimer('start')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surf-2 text-ink-dim text-sm font-medium hover:bg-border transition-colors"
                  >
                    <Timer size={15} strokeWidth={1.8} /> {tTimer('start')}
                  </button>
                )}
                <button
                  onClick={handleHeaderBtn}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pri text-on-pri text-sm font-semibold hover:opacity-90 transition-colors"
                >
                  {btnConfig.label}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surf-2 text-ink-dim text-sm font-medium hover:bg-border transition-colors"
                >
                  {tCommon('logout')}
                </button>
              </div>
            </div>
            <TimerBar />
            <main className="flex-1 bg-bg">{children}</main>
          </div>

          {studyModalOpen && (
            <AddSessionModal
              onClose={closeStudyModal}
              onSaved={closeStudyModal}
              initialTitle={studyModalInitialTitle}
              initialDurationMinutes={studyModalInitialDurationMinutes}
            />
          )}

          {showGoalModal && (
            <GoalModal mode="add" onClose={() => setShowGoalModal(false)} onSaved={() => setShowGoalModal(false)} />
          )}

          <CelebrationOverlay />
          <LeaveSessionGuardModal />
        </div>
      </CelebrationProvider>
    </ToastProvider>
  );
}
