'use client';

import { useTranslations } from 'next-intl';

function PreviewBar() {
  return (
    <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2 border-b border-white/6 rounded-t-2xl">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
      <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      <div className="flex-1 bg-gray-700 rounded-md py-1 px-3 text-xs text-gray-500 text-center">
        growpath.app/dashboard
      </div>
    </div>
  );
}

function PreviewSidebar() {
  const items = ['🏠 홈', '📚 공부 기록', '🗺 로드맵', '🤖 AI 튜터', '📝 노트'];
  return (
    <div className="w-32 bg-gray-900 border-r border-white/6 p-3 flex flex-col gap-1 hidden md:flex">
      {items.map((item, i) => (
        <div
          key={item}
          className={`px-2.5 py-1.5 rounded-lg text-xs ${i === 0 ? 'bg-indigo-500/15 text-indigo-300 font-semibold' : 'text-gray-500'}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function PreviewHeroCard({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-4 mb-3">
      <p className="text-xs text-white/60 mb-1">현재 위치</p>
      <p className="text-base font-bold text-white mb-3">Lead Architekt</p>
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full w-[68%] bg-white rounded-full" />
      </div>
      <p className="text-xs text-white/60 text-right mt-1">{t('previewGap')} 68%</p>
    </div>
  );
}

function PreviewCards({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
        <p className="text-xs text-gray-500 mb-1">{t('previewWeek')}</p>
        <p className="text-lg font-bold text-green-400">4</p>
        <p className="text-xs text-green-500 mt-0.5">↑ {t('previewUp')}</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
        <p className="text-xs text-gray-500 mb-1">{t('previewAI')}</p>
        <p className="text-sm font-semibold text-indigo-300 mt-1">NgRx</p>
        <p className="text-xs text-gray-500 mt-0.5">{t('previewAISub')}</p>
      </div>
    </div>
  );
}

function PreviewCoach({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  const items = [t('previewCoach1'), t('previewCoach2')];
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🤖</span>
        <span className="text-xs font-semibold text-gray-300">AI 코치</span>
      </div>
      {items.map((item) => (
        <div key={item} className="flex items-start gap-1.5 py-1.5 border-b border-white/5 last:border-none">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
          <p className="text-xs text-gray-400 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function LandingPreview() {
  const t = useTranslations('landing');

  return (
    <div className="max-w-3xl mx-auto px-6 mb-20">
      <p className="text-center text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">
        {t('previewLabel')}
      </p>
      <div className="bg-gray-900 border border-white/7 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5">
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
