'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { AuthChangeEvent, AuthError } from '@supabase/supabase-js';
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
    checkingSub: '이메일의 링크를 통해 접속해주세요.',
    invalidLink: '링크가 만료되었거나 이미 사용됐어요. 비밀번호 찾기를 다시 시도해주세요.',
    backToLogin: '로그인으로 돌아가기',
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
    invalidLink: 'This link has expired or was already used. Please request a new password reset.',
    backToLogin: 'Back to login',
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
    invalidLink: 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.',
    backToLogin: 'Zurück zum Login',
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
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    // This client uses the PKCE flow (@supabase/ssr's default), so the
    // recovery email links here with `?code=...` in the query string, not
    // the old implicit flow's `#access_token=...` hash - onAuthStateChange
    // alone never fires for a bare query-param code, which left this page
    // stuck on "checking your link" forever. Exchange it explicitly first;
    // fall back to onAuthStateChange only for the legacy hash-based link
    // shape, in case an already-sent email still points at the old flow.
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: AuthError | null }) => {
        if (error) {
          setLinkInvalid(true);
        } else {
          setReady(true);
        }
      });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
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
          {linkInvalid ? (
            <>
              <p className="text-sm text-ink mb-5">{t.invalidLink}</p>
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="text-sm font-semibold text-pri hover:opacity-90 transition-colors"
              >
                {t.backToLogin}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-ink mb-2">{t.checking}</h1>
              <p className="text-sm text-ink-faint">{t.checkingSub}</p>
            </>
          )}
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
