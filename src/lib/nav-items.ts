import { Compass, LucideIcon, NotebookText, PenLine, Rocket, Route } from 'lucide-react';

export type NavItem = {
  key: 'home' | 'study' | 'notes' | 'roadmap' | 'projects';
  path: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { key: 'home', path: '/dashboard', icon: Compass },
  { key: 'study', path: '/dashboard/study', icon: NotebookText },
  { key: 'notes', path: '/dashboard/notes', icon: PenLine },
  { key: 'roadmap', path: '/dashboard/roadmap', icon: Route },
  { key: 'projects', path: '/dashboard/projects', icon: Rocket },
];
