import { create } from 'zustand'

interface ModalStore {
  studyModalOpen: boolean
  studyModalInitialTitle: string
  openStudyModal: (title?: string) => void
  closeStudyModal: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  studyModalOpen: false,
  studyModalInitialTitle: '',
  openStudyModal: (title = '') =>
    set({ studyModalOpen: true, studyModalInitialTitle: title }),
  closeStudyModal: () =>
    set({ studyModalOpen: false, studyModalInitialTitle: '' }),
}))
