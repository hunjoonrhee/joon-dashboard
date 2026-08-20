'use client';

import { SUPPORTED_LANGUAGES } from '@/lib/language-codes';
import { upsertWithUser } from '@/lib/supabase';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MAX_BIO_CHARS = 600;

export default function Onboarding2() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);
  // '' means "no specific language" - only meaningful (and optional) outside
  // the language domain, where the goal might still require one (e.g. "German-
  // speaking lead developer" is domain "dev" but still needs targetLanguage set,
  // same case the roadmap generator's own system prompt already calls out).
  const [targetLanguage, setTargetLanguage] = useState('');

  // Step 1's domain card ("언어 학습" etc.) otherwise never reaches the AI
  // roadmap generator - without this, target_language is left entirely to
  // the model guessing from freeform goal/level text, which can misclassify
  // and silently leave HomeTab's language-module gate (target_language) off.
  useEffect(() => {
    const d = sessionStorage.getItem('ob_domain');
    setDomain(d);
    if (d === 'lang') setTargetLanguage(SUPPORTED_LANGUAGES[0]);
  }, []);

  const isLanguageDomain = domain === 'lang';

  const handleNext = async () => {
    if (!goal.trim() || !level.trim()) return;
    sessionStorage.setItem('ob_goal', goal.trim());
    sessionStorage.setItem('ob_level', level.trim());
    if (targetLanguage) {
      sessionStorage.setItem('ob_target_language', targetLanguage);
    }
    // Bio must land in `settings` before navigating - onboarding/3 kicks off
    // roadmap generation on mount, and /api/roadmap/generate reads bio
    // server-side at that point (see MAX_BIO_CHARS comment there).
    if (bio.trim()) {
      setSaving(true);
      await upsertWithUser('settings', { key: 'bio', value: bio.trim() }, { onConflict: 'key,user_id' });
      setSaving(false);
    }
    router.push(`/${locale}/onboarding/3`);
  };

  const inputCls =
    'w-full bg-surf-2 border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri transition-colors';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-border" />
        </div>
        <p className="text-xs text-ink-faint mb-1">{t('step2of3')}</p>
        <h2 className="text-xl font-bold text-ink mb-2">{t('step2Title')}</h2>
        <p className="text-sm text-ink-faint mb-6">{t('step2Sub')}</p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs text-ink-dim mb-2 block">{t('goalLabel')}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t('goalPlaceholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-2 block">{t('levelLabel')}</label>
            <input
              type="text"
              className={inputCls}
              placeholder={t('levelPlaceholder')}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNext();
              }}
            />
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-2 block">
              {isLanguageDomain ? t('targetLanguageLabel') : t('targetLanguageOptionalLabel')}
            </label>
            <select className={inputCls} value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
              {!isLanguageDomain && <option value="">{t('targetLanguageNone')}</option>}
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-dim mb-1 block">{t('bioLabel')}</label>
            <p className="text-xs text-ink-faint mb-2">{t('bioHint')}</p>
            <textarea
              className={`${inputCls} min-h-[70px] resize-none`}
              placeholder={t('bioPlaceholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={MAX_BIO_CHARS}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/${locale}/onboarding/1`)}
            className="px-5 py-3 rounded-xl border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('backBtn')}
          </button>
          <button
            onClick={handleNext}
            disabled={!goal.trim() || !level.trim() || saving}
            className="flex-1 py-3 rounded-xl bg-pri hover:opacity-90 disabled:opacity-40 text-sm font-bold text-on-pri transition-colors"
          >
            {t('generateBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
