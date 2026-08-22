'use client';

import { useTutorGuardStore } from '@/store/tutorGuardStore';

/** Wrap any navigate/sign-out call in this before running it - if an AI tutor session is mid-conversation (see tutorGuardStore), it's held and LeaveSessionGuardModal asks for confirmation instead of silently discarding the unsaved conversation. Runs the action immediately when no session is active. */
export function useGuardedAction() {
  const active = useTutorGuardStore((s) => s.active);
  const setPendingAction = useTutorGuardStore((s) => s.setPendingAction);

  return (action: () => void) => {
    if (active) {
      setPendingAction(() => action);
      return;
    }
    action();
  };
}
