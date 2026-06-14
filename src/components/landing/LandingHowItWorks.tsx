'use client';

import { useTranslations } from 'next-intl';

interface Step {
  numKey: string;
  titleKey: string;
  descKey: string;
  visual: React.ReactNode;
}

function GoalVisual() {
  return (
    <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-white/5">
      <p className="text-xs text-gray-500 mb-1.5">최종 목표</p>
      <div className="bg-gray-700 rounded-md px-3 py-1.5 text-xs text-white">Lead Architect</div>
    </div>
  );
}

function RoadmapVisual() {
  const stages = ['프론트엔드 심화', '시스템 설계 기초', 'Tech Lead 역할'];
  return (
    <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-white/5 flex flex-col gap-1.5">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              i === 0 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs ${i === 0 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function GapVisual() {
  return (
    <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-white/5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">갭 분석</span>
        <span className="text-green-400 font-bold">68%</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full w-[68%] bg-green-400 rounded-full" />
      </div>
    </div>
  );
}

export default function LandingHowItWorks() {
  const t = useTranslations('landing');

  const steps: Step[] = [
    { numKey: 'step1Num', titleKey: 'step1Title', descKey: 'step1Desc', visual: <GoalVisual /> },
    { numKey: 'step2Num', titleKey: 'step2Title', descKey: 'step2Desc', visual: <RoadmapVisual /> },
    { numKey: 'step3Num', titleKey: 'step3Title', descKey: 'step3Desc', visual: <GapVisual /> },
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">{t('howEyebrow')}</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">{t('howTitle')}</h2>
        <p className="text-gray-400 text-sm">{t('howSub')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {steps.map((step) => (
          <div key={step.numKey} className="bg-gray-900 border border-white/6 rounded-2xl p-5">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest mb-4">
              {t(step.numKey)}
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{t(step.titleKey)}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t(step.descKey)}</p>
            {step.visual}
          </div>
        ))}
      </div>
    </section>
  );
}
