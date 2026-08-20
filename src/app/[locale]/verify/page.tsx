'use client';

import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function VerifyPage() {
  const t = useTranslations('verify');

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-pri/10 flex items-center justify-center mx-auto mb-5">
          <MailCheck size={26} strokeWidth={1.8} className="text-pri" />
        </div>
        <h1 className="text-xl font-bold text-ink mb-2">{t('title')}</h1>
        <p className="text-sm text-ink-faint leading-relaxed mb-6 whitespace-pre-line">{t('sub')}</p>
        <p className="text-xs text-ink-faint/70">{t('spam')}</p>
      </div>
    </div>
  );
}
