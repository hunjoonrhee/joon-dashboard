'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

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

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`
    return pathname === fullPath || (path === '' && pathname === `/${locale}`)
  }

  const navigate = (path: string) => {
    router.push(`/${locale}${path}`)
  }

  // 탑 탭 — 데스크탑에서만, 사이드바 없는 페이지용
  const isTabPage = tabs.some((tab) => isActive(tab.path))

  return (
    <>
      {/* 모바일 하단 탭 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              isActive(tab.path) ? 'text-indigo-500' : 'text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span
              className={`text-xs ${isActive(tab.path) ? 'font-bold' : 'font-medium'}`}
            >
              {t(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* 모바일 상단 헤더 */}
      <div className="lg:hidden bg-white border-b border-gray-100 h-12 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-xs">
            🎯
          </div>
          <span className="text-sm font-bold text-gray-800">Dashboard</span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString('de-DE', {
            timeZone: 'Europe/Berlin',
          })}
        </span>
      </div>
    </>
  )
}
