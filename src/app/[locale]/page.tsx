'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/7 h-14 flex items-center justify-between px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">
            🧭
          </div>
          <span className="text-sm font-bold">Growpath</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            {t('login')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          ✦ {t('badge')}
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
          {t('headline1')}
          <br />
          <span className="text-indigo-400">{t('headline2')}</span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-8">
          {t('sub')}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/try`)}
            className="px-6 py-3 rounded-xl bg-indigo-500 font-semibold text-sm hover:bg-indigo-600 transition-colors"
          >
            ✦ {t('cta')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            {t('login')}
          </button>
        </div>
      </div>

      {/* 대시보드 미리보기 */}
      <div className="max-w-3xl mx-auto px-6 mb-20">
        <div className="bg-gray-900 border border-white/7 rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">{t('previewGap')}</p>
              <p className="text-2xl font-bold text-indigo-400">68%</p>
              <div className="h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">{t('previewWeek')}</p>
              <p className="text-2xl font-bold text-green-400">4회</p>
              <p className="text-xs text-green-400 mt-1">↑ {t('previewUp')}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">{t('previewAI')}</p>
              <p className="text-sm font-semibold text-indigo-300 mt-1">
                NgRx 공부해
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('previewAISub')}</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-gray-500 mb-2">
              Lead Architekt {t('previewRoadmap')}
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${i <= 2 ? 'bg-indigo-500' : 'bg-gray-700'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-indigo-400">
                {t('previewStage2')}
              </span>
              <span className="text-xs text-gray-500">
                {t('previewStage5')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-3xl mx-auto px-6 mb-20">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-3">
            핵심 기능
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('featTitle')}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: '🗺️',
              title: t('feat1Title'),
              desc: t('feat1Desc'),
              bg: 'bg-indigo-500/10',
            },
            {
              icon: '📊',
              title: t('feat2Title'),
              desc: t('feat2Desc'),
              bg: 'bg-green-500/10',
            },
            {
              icon: '🤖',
              title: t('feat3Title'),
              desc: t('feat3Desc'),
              bg: 'bg-amber-500/10',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-white/7 rounded-2xl p-5"
            >
              <div
                className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center text-xl mb-4`}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold mb-3">{t('ctaTitle')}</h2>
        <p className="text-gray-400 text-sm mb-6">{t('ctaSub')}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(`/${locale}/try`)}
            className="px-6 py-3 rounded-xl bg-indigo-500 font-semibold text-sm hover:bg-indigo-600 transition-colors"
          >
            ✦ {t('cta')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </div>
    </div>
  );
}
