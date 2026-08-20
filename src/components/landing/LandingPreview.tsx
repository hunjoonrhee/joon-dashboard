'use client';

import { Bot, BookOpen, Compass, NotebookPen, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';

function PreviewBar() {
  return (
    <div className="bg-surf-2 px-4 py-2.5 flex items-center gap-2 border-b border-border rounded-t-2xl">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-pri/70" />
      <div className="flex-1 bg-surf rounded-md py-1 px-3 text-xs text-ink-faint text-center">
        growpath.app/dashboard
      </div>
    </div>
  );
}

function PreviewSidebar() {
  const items = [
    { label: '홈', icon: Compass },
    { label: '공부 기록', icon: BookOpen },
    { label: '로드맵', icon: Route },
    { label: 'AI 튜터', icon: Bot },
    { label: '노트', icon: NotebookPen },
  ];
  return (
    <div className="w-32 bg-surf border-r border-border p-3 flex flex-col gap-1 hidden md:flex">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${i === 0 ? 'bg-pri/10 text-pri font-semibold' : 'text-ink-faint'}`}
        >
          <item.icon size={13} strokeWidth={1.8} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function PreviewHeroCard({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="bg-pri rounded-xl p-4 mb-3">
      <p className="text-xs text-on-pri/60 mb-1">현재 위치</p>
      <p className="text-base font-bold text-on-pri mb-3">Lead Architekt</p>
      <div className="h-1 bg-on-pri/20 rounded-full overflow-hidden">
        <div className="h-full w-[68%] bg-on-pri rounded-full" />
      </div>
      <p className="text-xs text-on-pri/60 text-right mt-1">{t('previewGap')} 68%</p>
    </div>
  );
}

function PreviewCards({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-surf-2 rounded-xl p-3 border border-border">
        <p className="text-xs text-ink-faint mb-1">{t('previewWeek')}</p>
        <p className="text-lg font-bold text-pri">4</p>
        <p className="text-xs text-pri mt-0.5">↑ {t('previewUp')}</p>
      </div>
      <div className="bg-surf-2 rounded-xl p-3 border border-border">
        <p className="text-xs text-ink-faint mb-1">{t('previewAI')}</p>
        <p className="text-sm font-semibold text-pri mt-1">NgRx</p>
        <p className="text-xs text-ink-faint mt-0.5">{t('previewAISub')}</p>
      </div>
    </div>
  );
}

function PreviewCoach({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  const items = [t('previewCoach1'), t('previewCoach2')];
  return (
    <div className="bg-surf-2 rounded-xl p-3 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={14} strokeWidth={1.8} className="text-pri" />
        <span className="text-xs font-semibold text-ink-dim">AI 코치</span>
      </div>
      {items.map((item) => (
        <div key={item} className="flex items-start gap-1.5 py-1.5 border-b border-border last:border-none">
          <div className="w-1.5 h-1.5 rounded-full bg-pri mt-1.5 flex-shrink-0" />
          <p className="text-xs text-ink-faint leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function LandingPreview() {
  const t = useTranslations('landing');

  return (
    <div className="max-w-3xl mx-auto px-6 mb-20">
      <p className="text-center text-xs font-semibold text-ink-faint uppercase tracking-widest mb-4">
        {t('previewLabel')}
      </p>
      <div className="bg-surf border border-border rounded-2xl overflow-hidden shadow-2xl shadow-pri/5">
        <PreviewBar />
        <div className="flex">
          <PreviewSidebar />
          <div className="flex-1 p-4">
            <PreviewHeroCard t={t} />
            <PreviewCards t={t} />
            <PreviewCoach t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
