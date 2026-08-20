'use client';

import { GitHubIcon, GoogleIcon } from '@/components/icons/OAuthIcons';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Compass, Eye, EyeOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SignupForm() {
  const t = useTranslations('login');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL 파라미터에서 체험 데이터 복구 → sessionStorage에 저장
    const goal = searchParams.get('goal');
    const level = searchParams.get('level');
    if (goal && level) {
      sessionStorage.setItem('ob_goal', goal);
      sessionStorage.setItem('ob_level', level);
    }
  }, [searchParams]);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(t('oauthError'));
      setLoading(null);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      setError(t('fillAllFields'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('passwordMismatch'));
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError(t('agreeRequired'));
      return;
    }

    setLoading('email');
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message.includes('already registered') ? t('emailExists') : error.message);
      setLoading(null);
      return;
    }
    router.push(`/${locale}/verify`);
  };

  const inputCls =
    'w-full bg-surf-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri transition-colors';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/${locale}`)}>
            <div className="w-8 h-8 bg-pri rounded-lg flex items-center justify-center text-on-pri">
              <Compass size={16} strokeWidth={1.8} />
            </div>
            <span className="text-lg font-bold text-ink">Growpath</span>
          </div>
        </div>

        <div className="bg-surf border border-border rounded-2xl p-7">
          <h2 className="text-lg font-bold text-ink mb-1">{t('signupTitle')}</h2>
          <p className="text-sm text-ink-faint mb-6">
            {t('hasAccount')}{' '}
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="text-pri hover:opacity-80 transition-colors"
            >
              {t('loginLink')}
            </button>
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => signInWithOAuth('google')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-surf-2 border border-border rounded-xl text-sm font-medium text-ink hover:bg-border disabled:opacity-50 transition-colors"
            >
              <GoogleIcon />
              {loading === 'google' ? t('loading') : t('googleSignup')}
            </button>
            <button
              onClick={() => signInWithOAuth('github')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-surf-2 border border-border rounded-xl text-sm font-medium text-ink hover:bg-border disabled:opacity-50 transition-colors"
            >
              <GitHubIcon />
              {loading === 'github' ? t('loading') : t('githubSignup')}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-faint">{t('or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              className={inputCls}
              placeholder={t('nickname')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <input
              type="email"
              className={inputCls}
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              className={inputCls}
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-10`}
                placeholder={t('passwordConfirm')}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSignup();
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-dim transition-colors"
                title={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded accent-pri"
                />
                <span className="text-xs text-ink-dim">
                  {t.rich('agreeTerms', {
                    link: (chunks) => (
                      <a
                        href={`/${locale}/terms`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pri hover:opacity-80 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 rounded accent-pri"
                />
                <span className="text-xs text-ink-dim">
                  {t.rich('agreePrivacy', {
                    link: (chunks) => (
                      <a
                        href={`/${locale}/privacy`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pri hover:opacity-80 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </span>
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading !== null}
            className="w-full mt-4 py-2.5 bg-pri hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-semibold text-on-pri transition-colors"
          >
            {loading === 'email' ? t('loading') : t('signupBtn')}
          </button>
          <p className="text-xs text-ink-faint text-center mt-3">{t('terms')}</p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
