'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

function SignupForm() {
  const t = useTranslations('login')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // URL 파라미터에서 체험 데이터 복구 → sessionStorage에 저장
    const goal = searchParams.get('goal')
    const level = searchParams.get('level')
    if (goal && level) {
      sessionStorage.setItem('ob_goal', goal)
      sessionStorage.setItem('ob_level', level)
    }
  }, [searchParams])

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setLoading(provider)
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    })
    setLoading(null)
  }

  const handleSignup = async () => {
    if (!email || !password || !nickname) { setError('모든 항목을 입력해주세요'); return }
    if (password !== passwordConfirm) { setError(t('passwordMismatch')); return }
    if (!agreeTerms || !agreePrivacy) { setError(t('agreeRequired')); return }

    setLoading('email')
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message.includes('already registered') ? t('emailExists') : error.message)
      setLoading(null)
      return
    }
    router.push(`/${locale}/verify`)
  }

  const inputCls = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/${locale}`)}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">🧭</div>
            <span className="text-lg font-bold text-white">Growpath</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-white/7 rounded-2xl p-7">
          <h2 className="text-lg font-bold text-white mb-1">{t('signupTitle')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('hasAccount')}{' '}
            <button onClick={() => router.push(`/${locale}/login`)} className="text-indigo-400 hover:text-indigo-300 transition-colors">
              {t('loginLink')}
            </button>
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <button onClick={() => signInWithOAuth('google')} disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <GoogleIcon />
              {loading === 'google' ? t('loading') : t('googleSignup')}
            </button>
            <button onClick={() => signInWithOAuth('github')} disabled={loading !== null}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <GitHubIcon />
              {loading === 'github' ? t('loading') : t('githubSignup')}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">{t('or')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex flex-col gap-2.5">
            <input type="text" className={inputCls} placeholder={t('nickname')}
              value={nickname} onChange={(e) => setNickname(e.target.value)}
              style={{ caretColor: 'white' }} />
            <input type="email" className={inputCls} placeholder={t('email')}
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ caretColor: 'white' }} />
            <input type="password" className={inputCls} placeholder={t('password')}
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ caretColor: 'white' }} />
            <input type="password" className={inputCls} placeholder={t('passwordConfirm')}
              value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSignup() }}
              style={{ caretColor: 'white' }} />
            <div className="flex flex-col gap-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-xs text-gray-400">{t('agreeTerms')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-xs text-gray-400">{t('agreePrivacy')}</span>
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <button onClick={handleSignup} disabled={loading !== null}
            className="w-full mt-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors">
            {loading === 'email' ? t('loading') : t('signupBtn')}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">{t('terms')}</p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
