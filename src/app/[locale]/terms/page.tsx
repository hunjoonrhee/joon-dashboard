'use client';

import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
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

        <h1 className="text-2xl font-bold text-ink mb-1">{t('termsTitle')}</h1>
        <p className="text-xs text-ink-faint mb-8">{t('lastUpdated', { date: '2026-08-20' })}</p>

        <div className="flex flex-col gap-6 text-sm text-ink-dim leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms1Title')}</h2>
            <p>{t('terms1Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms2Title')}</h2>
            <p>{t('terms2Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms3Title')}</h2>
            <p>{t('terms3Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms4Title')}</h2>
            <p>{t('terms4Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms5Title')}</h2>
            <p>{t('terms5Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('terms6Title')}</h2>
            <p>{t('terms6Body')}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-ink mb-2">{t('contactTitle')}</h2>
            <p>{t('contactBody')}</p>
          </section>
        </div>

        <button
          onClick={() => router.push(`/${locale}/privacy`)}
          className="mt-8 text-sm text-pri hover:opacity-80 transition-colors font-medium"
        >
          {t('viewPrivacy')} →
        </button>
      </div>
    </main>
  );
}
