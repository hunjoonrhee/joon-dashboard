'use client';

import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('legal');

  return (
    <main className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-ink-faint hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">{t('back')}</span>
        </button>

        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
          <ShieldAlert size={16} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{t('draftNotice')}</p>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-1">{t('privacyTitle')}</h1>
        <p className="text-xs text-ink-faint mb-8">{t('lastUpdated', { date: '2026-08-20' })}</p>

        <div className="flex flex-col gap-6 text-sm text-ink-dim leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('privacy1Title')}</h2>
            <p>{t('privacy1Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('privacy2Title')}</h2>
            <p className="mb-2">{t('privacy2Body')}</p>
            <ul className="list-disc list-inside flex flex-col gap-1 text-ink-dim">
              <li>{t('privacy2Item1')}</li>
              <li>{t('privacy2Item2')}</li>
              <li>{t('privacy2Item3')}</li>
              <li>{t('privacy2Item4')}</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('privacy3Title')}</h2>
            <p>{t('privacy3Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('privacy4Title')}</h2>
            <p>{t('privacy4Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('privacy5Title')}</h2>
            <p>{t('privacy5Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('contactTitle')}</h2>
            <p>{t('contactBody')}</p>
          </section>
        </div>

        <button
          onClick={() => router.push(`/${locale}/terms`)}
          className="mt-8 text-sm text-pri hover:opacity-80 transition-colors font-medium"
        >
          {t('viewTerms')} →
        </button>
      </div>
    </main>
  );
}
