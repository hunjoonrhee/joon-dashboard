'use client';

import { GitHubIcon, GoogleIcon } from '@/components/icons/OAuthIcons';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Compass, Eye, EyeOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const t = useTranslations('login');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?locale=${locale}`,
      },
    });
    if (error) {
      setError(t('oauthError'));
      setLoading(null);
    }
    // Success case navigates away via the OAuth redirect, so loading stays true until then.
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('fillAllFields'));
      return;
    }
    setLoading('email');
    setError(null);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(t('loginError'));
      setLoading(null);
      return;
    }
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'onboarding_completed')
      .eq('user_id', data.user.id)
      .single();

    if (setting?.value === 'true') {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push(`/${locale}/onboarding/1`);
    }
    setLoading(null);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('emailRequired'));
      return;
    }
    setLoading('reset');
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/reset-password?locale=${locale}`,
    });
    setLoading(null);
    setError(t('resetSent'));
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
          <h2 className="text-lg font-bold text-ink mb-1">{t('loginTitle')}</h2>
          <p className="text-sm text-ink-faint mb-6">
            {t('noAccount')}{' '}
            <button
              onClick={() => router.push(`/${locale}/signup`)}
              className="text-pri hover:opacity-80 transition-colors"
            >
              {t('signupLink')}
            </button>
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => signInWithOAuth('google')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-surf-2 border border-border rounded-xl text-sm font-medium text-ink hover:bg-border disabled:opacity-50 transition-colors"
            >
              <GoogleIcon />
              {loading === 'google' ? t('loading') : t('googleLogin')}
            </button>
            <button
              onClick={() => signInWithOAuth('github')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-surf-2 border border-border rounded-xl text-sm font-medium text-ink hover:bg-border disabled:opacity-50 transition-colors"
            >
              <GitHubIcon />
              {loading === 'github' ? t('loading') : t('githubLogin')}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-faint">{t('or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col gap-2.5">
            <input
              type="email"
              className={inputCls}
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-10`}
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
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
            <div className="text-right">
              <button
                onClick={handleForgotPassword}
                className="text-xs text-ink-faint hover:text-ink-dim transition-colors"
              >
                {t('forgotPassword')}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading !== null}
            className="w-full mt-4 py-2.5 bg-pri hover:opacity-90 disabled:opacity-50 rounded-xl text-sm font-semibold text-on-pri transition-colors"
          >
            {loading === 'email' ? t('loading') : t('loginBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
