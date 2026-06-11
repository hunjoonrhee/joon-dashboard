'use client'

import { supabase } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { key: 'home', path: '', icon: '🏠' },
  { key: 'study', path: '/study', icon: '📖' },
  { key: 'notes', path: '/notes', icon: '✍️' },
]

const planItems = [
  { key: 'roadmap', path: '/roadmap', icon: '🗺' },
  { key: 'projects', path: '/projects', icon: '🚀' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.split('/')[1] ?? 'ko'
  const t = useTranslations('nav')
  const [name, setName] = useState('Joon')
  const [role, setRole] = useState('미드레벨 → 시니어')

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach((s: { key: string; value: string }) => {
            map[s.key] = s.value
          })
          if (map.name) setName(map.name)
          if (map.big_goal_sub) setRole(map.big_goal_sub)
        }
      })
  }, [])

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`
    return pathname === fullPath || (path === '' && pathname === `/${locale}`)
  }

  const navigate = (path: string) => router.push(`/${locale}${path}`)

  return (
    <aside className="w-56 bg-white border-r border-gray-100 fixed top-0 left-0 h-screen flex flex-col z-20 hidden lg:flex">
      {/* 로고 — 클릭하면 홈으로 */}
      <div
        className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigate('')}
      >
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">
          🎯
        </div>
        <span className="text-sm font-bold text-gray-800">Dashboard</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mt-1">
          {t('mainSection')}
        </div>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-colors ${
              isActive(item.path)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span
              className={`text-sm font-medium ${isActive(item.path) ? 'font-semibold' : ''}`}
            >
              {t(item.key)}
            </span>
          </button>
        ))}

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mt-3">
          {t('planSection')}
        </div>
        {planItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-colors ${
              isActive(item.path)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span
              className={`text-sm font-medium ${isActive(item.path) ? 'font-semibold' : ''}`}
            >
              {t(item.key)}
            </span>
          </button>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">
              {name}
            </div>
            <div className="text-xs text-gray-400 truncate">{role}</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-full transition-colors"
        >
          <Settings size={15} />
          <span className="text-sm">{t('settings')}</span>
        </button>
      </div>
    </aside>
  )
}
