import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerState {
  status: TimerStatus;
  topic: string;
  /** Wall-clock ms epoch for the start of the current running segment; null while paused/idle. Using a timestamp instead of trusting a JS interval's tick count means elapsed time stays correct across tab backgrounding, sleep, or a full page reload. */
  startedAt: number | null;
  /** Seconds banked from segments before the current one. */
  accumulatedSeconds: number;
  start: (topic?: string) => void;
  setTopic: (topic: string) => void;
  pause: () => void;
  resume: () => void;
  /** Stops the timer and returns the final topic/duration for handoff into the study-log modal. Rounds up to at least 1 minute so a quick finish doesn't produce a pointless 0-minute entry. */
  finish: () => { topic: string; minutes: number } | null;
  discard: () => void;
}

const elapsedSeconds = (state: Pick<TimerState, 'status' | 'startedAt' | 'accumulatedSeconds'>) => {
  if (state.status === 'running' && state.startedAt) {
    return state.accumulatedSeconds + Math.floor((Date.now() - state.startedAt) / 1000);
  }
  return state.accumulatedSeconds;
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      topic: '',
      startedAt: null,
      accumulatedSeconds: 0,

      start: (topic = '') => set({ status: 'running', topic, startedAt: Date.now(), accumulatedSeconds: 0 }),

      setTopic: (topic) => set({ topic }),

      pause: () => {
        const state = get();
        if (state.status !== 'running') return;
        set({ status: 'paused', accumulatedSeconds: elapsedSeconds(state), startedAt: null });
      },

      resume: () => {
        const state = get();
        if (state.status !== 'paused') return;
        set({ status: 'running', startedAt: Date.now() });
      },

      finish: () => {
        const state = get();
        if (state.status === 'idle') return null;
        const seconds = elapsedSeconds(state);
        set({ status: 'idle', topic: '', startedAt: null, accumulatedSeconds: 0 });
        return { topic: state.topic, minutes: Math.max(1, Math.round(seconds / 60)) };
      },

      discard: () => set({ status: 'idle', topic: '', startedAt: null, accumulatedSeconds: 0 }),
    }),
    { name: 'growpath-timer', storage: createJSONStorage(() => localStorage) }
  )
);

export const getTimerElapsedSeconds = (state: Pick<TimerState, 'status' | 'startedAt' | 'accumulatedSeconds'>) =>
  elapsedSeconds(state);
