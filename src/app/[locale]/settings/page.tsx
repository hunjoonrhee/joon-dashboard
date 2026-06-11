'use client'

import { supabase } from '@/lib/supabase'
import type { Setting } from '@/types'
import { ArrowLeft, Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const LOCALES = [
  { value: 'ko', label: '한국어' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  const [form, setForm] = useState({
    name: '',
    big_goal: '',
    big_goal_sub: '',
    monthly_session_target: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s: Setting) => {
          map[s.key] = s.value
        })
        setForm({
          name: map.name ?? '',
          big_goal: map.big_goal ?? '',
          big_goal_sub: map.big_goal_sub ?? '',
          monthly_session_target: map.monthly_session_target ?? '',
        })
      }
    }
    fetch()
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all(
      Object.entries(form).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const switchLocale = (locale: string) => {
    // /ko/settings → /de/settings
    const segments = pathname.split('/')
    segments[1] = locale
    router.push(segments.join('/'))
  }

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">뒤로</span>
      </button>

      <div className="flex flex-col gap-4">
        {/* 기본 설정 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-4">기본 설정</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이름</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                큰 목표
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: 리드 아키텍트"
                value={form.big_goal}
                onChange={(e) => setForm({ ...form, big_goal: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                큰 목표 설명
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: 시니어 → 리드 → 아키텍트"
                value={form.big_goal_sub}
                onChange={(e) =>
                  setForm({ ...form, big_goal_sub: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                월간 세션 목표 (회)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                value={form.monthly_session_target}
                onChange={(e) =>
                  setForm({ ...form, monthly_session_target: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* 언어 설정 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">언어 설정</p>
          <div className="flex gap-2">
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                onClick={() => switchLocale(loc.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currentLocale === loc.value
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <Check size={16} />
              저장됐어!
            </>
          ) : saving ? (
            '저장 중...'
          ) : (
            '저장'
          )}
        </button>
      </div>
    </main>
  )
}
