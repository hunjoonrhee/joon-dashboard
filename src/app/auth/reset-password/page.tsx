'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
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
      setError('비밀번호가 일치하지 않아');
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
    router.push('/ko/dashboard');
  };

  const inputCls =
    'w-full bg-gray-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors';

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-white/7 rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-5">🔑</div>
          <h1 className="text-xl font-bold text-white mb-2">
            링크를 확인하는 중...
          </h1>
          <p className="text-sm text-gray-400">
            이메일의 링크를 통해 접속해줘.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-10 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-white">새 비밀번호 설정</h1>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            className={inputCls}
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className={inputCls}
            placeholder="비밀번호 확인"
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
            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors mt-1"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    </div>
  );
}
