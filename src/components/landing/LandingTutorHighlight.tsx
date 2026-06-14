'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

function TutorChat({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/6">
        <span className="text-xs font-semibold text-white">{t('tutorChatTitle')}</span>
        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
          🕐 {t('tutorChatTimer')}
        </span>
      </div>

      {/* AI 설명 */}
      <div className="bg-gray-800 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
        <p className="text-[10px] font-semibold text-indigo-400 mb-1">AI 튜터</p>
        <p className="text-xs text-gray-300 leading-relaxed">
          NgRx는 Angular 앱의 상태를 중앙에서 관리하는 라이브러리예요. Store → Action → Reducer 흐름을 이해하면 돼요.
        </p>
      </div>

      {/* 퀴즈 */}
      <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">📝 퀴즈</p>
        <p className="text-xs text-white font-medium mb-2.5">
          NgRx에서 상태를 변경하는 건 누구의 역할인가요?
        </p>
        <div className="flex flex-col gap-1.5">
          {['Action', 'Reducer', 'Selector'].map((opt, i) => (
            <div
              key={opt}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                i === 1
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-gray-800 border-white/5 text-gray-500'
              }`}
            >
              {i === 1 && '✓ '}{opt}
            </div>
          ))}
        </div>
      </div>

      {/* AI 피드백 */}
      <div className="bg-gray-800 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
        <p className="text-[10px] font-semibold text-indigo-400 mb-1">AI 튜터</p>
        <p className="text-xs text-gray-300 leading-relaxed">
          정확해요! 다음은 Effect를 배워볼까요?
        </p>
      </div>
    </div>
  );
}

export default function LandingTutorHighlight() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  const features = [
    t('tutorFeat1'),
    t('tutorFeat2'),
    t('tutorFeat3'),
    t('tutorFeat4'),
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="bg-gradient-to-br from-indigo-500/8 to-violet-500/5 border border-indigo-500/20 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">
            {t('tutorEyebrow')}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-3">
            {t('tutorTitle')}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            {t('tutorDesc')}
          </p>
          <ul className="flex flex-col gap-2 mb-6">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-green-400">✓</span>
                {feat}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            {t('tutorCta')}
          </button>
        </div>

        <TutorChat t={t} />
      </div>
    </section>
  );
}
