'use client'

import { supabase } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const tabs = [
  { label: '홈', path: '/' },
  { label: '공부 기록', path: '/study' },
  { label: '목표', path: '/goals' },
  { label: '프로젝트', path: '/projects' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('Joon')

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'name')
      .single()
      .then(({ data }) => {
        if (data) setName(data.value)
      })
  }, [])

  const isTab = tabs.some((t) => t.path === pathname)

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">
              🎯
            </div>
            <span className="text-sm font-semibold text-gray-800">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('de-DE', {
                timeZone: 'Europe/Berlin',
              })}
            </span>
            <button
              onClick={() => router.push('/settings')}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {isTab && (
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.path}
                onClick={() => router.push(t.path)}
                className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                  pathname === t.path
                    ? 'text-indigo-500 border-indigo-500'
                    : 'text-gray-400 border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
