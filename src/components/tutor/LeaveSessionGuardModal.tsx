'use client';

import { useTutorGuardStore } from '@/store/tutorGuardStore';
import { useTranslations } from 'next-intl';

/** Mounted once in AppShell - renders whenever useGuardedAction held a navigate/sign-out call because an AI tutor session was mid-conversation, so leaving would silently lose it (the transcript only saves to the DB on "세션 종료", not as you go). */
export default function LeaveSessionGuardModal() {
  const t = useTranslations('tutor');
  const pendingAction = useTutorGuardStore((s) => s.pendingAction);
  const setPendingAction = useTutorGuardStore((s) => s.setPendingAction);
  const setActive = useTutorGuardStore((s) => s.setActive);

  if (!pendingAction) return null;

  const handleLeave = () => {
    setActive(false);
    const action = pendingAction;
    setPendingAction(null);
    action();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surf border border-border rounded-2xl p-6 max-w-sm w-full">
        <h2 className="text-base font-bold text-ink mb-2">{t('leaveConfirmTitle')}</h2>
        <p className="text-sm text-ink-dim mb-5">{t('leaveConfirmSub')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPendingAction(null)}
            className="flex-1 py-2.5 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 transition-colors"
          >
            {t('leaveConfirmStay')}
          </button>
          <button
            onClick={handleLeave}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('leaveConfirmLeave')}
          </button>
        </div>
      </div>
    </div>
  );
}
