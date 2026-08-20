'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { KeyRound, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// This route lives outside the `[locale]` segment (Supabase's password-recovery
// redirect must point at a fixed, dashboard-registered URL), so it has no
// NextIntlClientProvider to pull from - login/page.tsx passes ?locale= along
// when it sends the reset email, and this tiny inline dictionary covers just
// this page's own strings rather than pulling in the full i18n setup.
const STRINGS = {
  ko: {
    checking: '링크를 확인하는 중...',
    checkingSub: '이메일의 링크를 통해 접속해줘.',
    title: '새 비밀번호 설정',
    newPassword: '새 비밀번호',
    confirmPassword: '비밀번호 확인',
    mismatch: '비밀번호가 일치하지 않아요',
    submit: '비밀번호 변경',
    submitting: '변경 중...',
  },
  en: {
    checking: 'Checking your link...',
    checkingSub: 'Please open this page from the link in your email.',
    title: 'Set a new password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    mismatch: "Passwords don't match",
    submit: 'Change password',
    submitting: 'Changing...',
  },
  de: {
    checking: 'Link wird überprüft...',
    checkingSub: 'Bitte öffne diese Seite über den Link in deiner E-Mail.',
    title: 'Neues Passwort festlegen',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    mismatch: 'Die Passwörter stimmen nicht überein',
    submit: 'Passwort ändern',
    submitting: 'Wird geändert...',
  },
} as const;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const locale = (searchParams.get('locale') as keyof typeof STRINGS) ?? 'ko';
  const t = STRINGS[locale] ?? STRINGS.ko;

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase가 URL hash에서 세션을 자동으로 처리함
    supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  const handleReset = async () => {
    if (!password || !passwordConfirm) return;
    if (password !== passwordConfirm) {
      setError(t.mismatch);
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(`/${locale}/dashboard`);
  };

  const inputCls =
    'w-full bg-surf-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri transition-colors';

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surf border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-pri/10 flex items-center justify-center mx-auto mb-5">
            <KeyRound size={26} strokeWidth={1.8} className="text-pri" />
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">{t.checking}</h1>
          <p className="text-sm text-ink-faint">{t.checkingSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-10 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-pri/10 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} strokeWidth={1.8} className="text-pri" />
          </div>
          <h1 className="text-xl font-bold text-ink">{t.title}</h1>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            className={inputCls}
            placeholder={t.newPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className={inputCls}
            placeholder={t.confirmPassword}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReset();
            }}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-2.5 bg-pri hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-semibold text-on-pri transition-colors mt-1"
          >
            {loading ? t.submitting : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
