'use client'

import { supabase } from '@/lib/supabase'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { key: 'home', path: '/dashboard', icon: '🏠' },
  { key: 'study', path: '/dashboard/study', icon: '📖' },
  { key: 'notes', path: '/dashboard/notes', icon: '✍️' },
  { key: 'roadmap', path: '/dashboard/roadmap', icon: '🗺' },
  { key: 'projects', path: '/dashboard/projects', icon: '🚀' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.split('/')[1] ?? 'ko'
  const t = useTranslations('nav')
  const [name, setName] = useState('Joon')
  const [role, setRole] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .then(({ data }: { data: { key: string; value: string }[] | null }) => {
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

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`
    return pathname === fullPath || pathname.startsWith(`/${locale}${path}/`)
  }

  const navigate = (path: string) => router.push(`/${locale}${path}`)

  const handleSignOut = async () => {
    const client = createSupabaseBrowserClient()
    await client.auth.signOut()
    router.push(`/${locale}/login`)
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 fixed top-0 left-0 h-screen flex flex-col z-20 hidden lg:flex">
      <div
        className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigate('/dashboard')}
      >
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">
          🧭
        </div>
        <span className="text-sm font-bold text-gray-800">Growpath</span>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
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
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">
              {name}
            </div>
            {role && (
              <div className="text-xs text-gray-400 truncate">{role}</div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/settings')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-full transition-colors"
        >
          <Settings size={15} />
          <span className="text-sm">{t('settings')}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 w-full transition-colors mt-0.5"
        >
          <span className="text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
