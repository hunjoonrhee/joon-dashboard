'use client';

import { Check, Clock, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

function TutorChat({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <div className="bg-surf border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <span className="text-xs font-semibold text-ink">{t('tutorChatTitle')}</span>
        <span className="flex items-center gap-1 text-xs text-pri bg-pri/10 px-2 py-0.5 rounded-full">
          <Clock size={11} strokeWidth={1.8} /> {t('tutorChatTimer')}
        </span>
      </div>

      {/* AI 설명 */}
      <div className="bg-surf-2 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
        <p className="text-[10px] font-semibold text-pri mb-1">AI 튜터</p>
        <p className="text-xs text-ink-dim leading-relaxed">
          NgRx는 Angular 앱의 상태를 중앙에서 관리하는 라이브러리예요. Store → Action → Reducer 흐름을 이해하면 돼요.
        </p>
      </div>

      {/* 퀴즈 */}
      <div className="bg-amber/8 border border-amber/15 rounded-xl p-3">
        <p className="flex items-center gap-1 text-[10px] font-bold text-amber uppercase tracking-wider mb-2">
          <FileText size={11} strokeWidth={1.8} /> 퀴즈
        </p>
        <p className="text-xs text-ink font-medium mb-2.5">NgRx에서 상태를 변경하는 건 누구의 역할인가요?</p>
        <div className="flex flex-col gap-1.5">
          {['Action', 'Reducer', 'Selector'].map((opt, i) => (
            <div
              key={opt}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border ${
                i === 1 ? 'bg-pri/10 border-pri/20 text-pri' : 'bg-surf-2 border-border text-ink-faint'
              }`}
            >
              {i === 1 && <Check size={12} strokeWidth={2.2} />}
              {opt}
            </div>
          ))}
        </div>
      </div>

      {/* AI 피드백 */}
      <div className="bg-surf-2 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
        <p className="text-[10px] font-semibold text-pri mb-1">AI 튜터</p>
        <p className="text-xs text-ink-dim leading-relaxed">정확해요! 다음은 Effect를 배워볼까요?</p>
      </div>
    </div>
  );
}

export default function LandingTutorHighlight() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  const features = [t('tutorFeat1'), t('tutorFeat2'), t('tutorFeat3'), t('tutorFeat4')];

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="bg-pri/5 border border-pri/20 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-pri mb-3">{t('tutorEyebrow')}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-3">{t('tutorTitle')}</h2>
          <p className="text-sm text-ink-faint leading-relaxed mb-5">{t('tutorDesc')}</p>
          <ul className="flex flex-col gap-2 mb-6">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-xs text-ink-faint">
                <Check size={13} strokeWidth={2.2} className="text-pri" />
                {feat}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-5 py-2.5 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 transition-colors"
          >
            {t('tutorCta')}
          </button>
        </div>

        <TutorChat t={t} />
      </div>
    </section>
  );
}
