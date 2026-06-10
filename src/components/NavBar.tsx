'use client'

import { supabase } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const tabs = [
  { key: 'home', path: '', icon: '🏠' },
  { key: 'study', path: '/study', icon: '📖' },
  { key: 'notes', path: '/notes', icon: '✍️' },
  { key: 'roadmap', path: '/roadmap', icon: '🗺' },
  { key: 'projects', path: '/projects', icon: '🚀' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const locale = pathname.split('/')[1] ?? 'ko'
  const [name, setName] = useState('Joon')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'name')
      .single()
      .then(({ data }) => {
        if (data?.value) setName(data.value)
      })
    // 날짜는 클라이언트에서만 렌더 — SSR hydration mismatch 방지
    setDateStr(
      new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'ko' ? 'ko-KR' : 'en-US', {
        timeZone: 'Europe/Berlin',
      })
    )
  }, [])

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`
    return pathname === fullPath || (path === '' && pathname === `/${locale}`)
  }

  const navigate = (path: string) => {
    router.push(`/${locale}${path}`)
  }

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <>
      {/* 모바일 하단 탭 */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isActive(tab.path) ? 'text-indigo-500' : 'text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={`text-xs ${isActive(tab.path) ? 'font-bold' : 'font-medium'}`}>
              {t(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* 모바일 상단 헤더 */}
      <div className="lg:hidden bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4 sticky top-0 z-10">
        {/* 왼쪽: 로고 */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-xs" suppressHydrationWarning>
            🎯
          </div>
          <span className="text-sm font-bold text-gray-800">Dashboard</span>
        </div>

        {/* 오른쪽: 언어 전환 + 설정 */}
        <div className="flex items-center gap-2">
          {/* 언어 전환 */}
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(['ko', 'de', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  locale === l
                    ? 'bg-white text-gray-800 font-semibold shadow-sm'
                    : 'text-gray-400'
                }`}
              >
                {l === 'ko' ? '한' : l === 'de' ? 'DE' : 'EN'}
              </button>
            ))}
          </div>
          {/* 설정 버튼 */}
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>
    </>
  )
}
