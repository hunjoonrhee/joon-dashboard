export type CelebrationColorTheme = 'green' | 'gold' | 'purple';

export type ResolvedCelebrationTheme = {
  gradient: readonly [string, string];
  ringColor: string;
  eyebrowColor: string;
  titleColor: string;
  subtitleColor: string;
  buttonBg: string;
  buttonText: string;
  secondaryColor: string;
  dialTrack: string;
  dialColorFrom: string;
  dialColorTo: string;
  markerFill: string;
};

// Deliberately theme-independent - celebration always uses a dark gradient
// regardless of the app's own light/dark mode, same as growpath-mobile.
export const CELEBRATION_THEMES: Record<CelebrationColorTheme, ResolvedCelebrationTheme> = {
  green: {
    gradient: ['rgba(47,93,80,1)', 'rgba(30,42,36,1)'],
    ringColor: '#9FD9B8',
    eyebrowColor: '#9FD9B8',
    titleColor: '#F4F6F1',
    subtitleColor: '#C4DCCE',
    buttonBg: '#F4F6F1',
    buttonText: '#1E2A24',
    secondaryColor: '#9FD9B8',
    dialTrack: 'rgba(255,255,255,0.15)',
    dialColorFrom: '#6FBF95',
    dialColorTo: '#9FD9B8',
    markerFill: '#1E4438',
  },
  gold: {
    gradient: ['rgba(51,38,22,1)', 'rgba(28,20,12,1)'],
    ringColor: '#D8B778',
    eyebrowColor: '#D8B778',
    titleColor: '#F7F3EA',
    subtitleColor: '#CBB68C',
    buttonBg: '#F7F3EA',
    buttonText: '#2A2013',
    secondaryColor: '#D8B778',
    dialTrack: 'rgba(255,255,255,0.12)',
    dialColorFrom: '#B8925A',
    dialColorTo: '#D8B778',
    markerFill: '#241A10',
  },
  purple: {
    gradient: ['rgba(58,33,89,1)', 'rgba(31,18,51,1)'],
    ringColor: '#C9A6FF',
    eyebrowColor: '#C9A6FF',
    titleColor: '#F5F1FF',
    subtitleColor: '#CBB8E8',
    buttonBg: '#F5F1FF',
    buttonText: '#241542',
    secondaryColor: '#C9A6FF',
    dialTrack: 'rgba(255,255,255,0.12)',
    dialColorFrom: '#9B72D6',
    dialColorTo: '#C9A6FF',
    markerFill: '#1F1233',
  },
};
