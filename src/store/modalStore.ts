import { create } from 'zustand';

interface ModalStore {
  studyModalOpen: boolean;
  studyModalInitialTitle: string;
  studyModalInitialDurationMinutes: number | null;
  openStudyModal: (title?: string, durationMinutes?: number) => void;
  closeStudyModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  studyModalOpen: false,
  studyModalInitialTitle: '',
  studyModalInitialDurationMinutes: null,
  openStudyModal: (title = '', durationMinutes) =>
    set({ studyModalOpen: true, studyModalInitialTitle: title, studyModalInitialDurationMinutes: durationMinutes ?? null }),
  closeStudyModal: () => set({ studyModalOpen: false, studyModalInitialTitle: '', studyModalInitialDurationMinutes: null }),
}));
