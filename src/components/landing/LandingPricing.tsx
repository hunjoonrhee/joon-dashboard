'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface PricingFeature {
  labelKey: keyof ReturnType<typeof useTranslations<'landing'>>;
  included: boolean;
}

const FREE_FEATURES: PricingFeature[] = [
  { labelKey: 'freeF1', included: true },
  { labelKey: 'freeF2', included: true },
  { labelKey: 'freeF3', included: true },
  { labelKey: 'freeF4', included: true },
  { labelKey: 'freeF5', included: false },
  { labelKey: 'freeF6', included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { labelKey: 'proF1', included: true },
  { labelKey: 'proF2', included: true },
  { labelKey: 'proF3', included: true },
  { labelKey: 'proF4', included: true },
  { labelKey: 'proF5', included: true },
  { labelKey: 'proF6', included: true },
];

function FeatureList({
  features,
  t,
}: {
  features: PricingFeature[];
  t: ReturnType<typeof useTranslations<'landing'>>;
}) {
  return (
    <ul className="flex flex-col gap-2.5 mb-6">
      {features.map((f) => (
        <li key={f.labelKey} className="flex items-center gap-2 text-xs text-gray-400">
          <span className={f.included ? 'text-green-400' : 'text-gray-600'}>
            {f.included ? '✓' : '✗'}
          </span>
          {t(f.labelKey)}
        </li>
      ))}
    </ul>
  );
}

export default function LandingPricing() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const router = useRouter();

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-3">
          {t('pricingEyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {t('pricingTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Free */}
        <div className="bg-gray-900 border border-white/6 rounded-2xl p-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            {t('freeTier')}
          </p>
          <div className="mb-1">
            <span className="text-3xl font-extrabold text-white">{t('freePrice')}</span>
            <span className="text-sm text-gray-500">{t('freePer')}</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">{t('freeDesc')}</p>
          <FeatureList features={FREE_FEATURES} t={t} />
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="w-full py-2.5 rounded-xl bg-gray-800 border border-white/10 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            {t('freeBtnLabel')}
          </button>
        </div>

        {/* Pro */}
        <div className="relative bg-gradient-to-br from-indigo-500/10 to-gray-900 border border-indigo-500/30 rounded-2xl p-6">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg">
            {t('proPopular')}
          </div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            {t('proTier')}
          </p>
          <div className="mb-1">
            <span className="text-3xl font-extrabold text-white">{t('proPrice')}</span>
            <span className="text-sm text-gray-500">{t('proPer')}</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">{t('proDesc')}</p>
          <FeatureList features={PRO_FEATURES} t={t} />
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            {t('proBtnLabel')}
          </button>
        </div>
      </div>
    </section>
  );
}
