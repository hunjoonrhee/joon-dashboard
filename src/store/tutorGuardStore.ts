import { create } from 'zustand';

interface TutorGuardStore {
  /** True once the user has sent at least one real message in an unfinished AI tutor session - the conversation only gets saved to the DB when "세션 종료" completes, so leaving before that silently loses it. */
  active: boolean;
  /** The navigate/logout call that Sidebar/NavBar held instead of running immediately, because `active` was true - consumed by LeaveSessionGuardModal. */
  pendingAction: (() => void) | null;
  setActive: (active: boolean) => void;
  setPendingAction: (action: (() => void) | null) => void;
}

export const useTutorGuardStore = create<TutorGuardStore>((set) => ({
  active: false,
  pendingAction: null,
  setActive: (active) => set({ active }),
  setPendingAction: (pendingAction) => set({ pendingAction }),
}));
