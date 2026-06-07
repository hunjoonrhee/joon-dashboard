'use client'

import { supabase } from '@/lib/supabase'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const tabs = [
  { key: 'home', path: '' },
  { key: 'study', path: '/study' },
  { key: 'goals', path: '/goals' },
  { key: 'projects', path: '/projects' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('Joon')
  const t = useTranslations('nav')

  const locale = pathname.split('/')[1] ?? 'ko'
  const pathWithoutLocale = '/' + pathname.split('/').slice(2).join('/')

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

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  const isTab = tabs.some((tab) => {
    const fullPath = `/${locale}${tab.path}`
    return (
      pathname === fullPath || (tab.path === '' && pathname === `/${locale}`)
    )
  })

  const currentTab = `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`

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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['ko', 'de', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    locale === l
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l === 'ko' ? '한' : l === 'de' ? 'DE' : 'EN'}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('de-DE', {
                timeZone: 'Europe/Berlin',
              })}
            </span>
            <button
              onClick={() => router.push(`/${locale}/settings`)}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {isTab && (
          <div className="flex">
            {tabs.map((tab) => {
              const fullPath = `/${locale}${tab.path}`
              const isActive =
                pathname === fullPath ||
                (tab.path === '' && pathname === `/${locale}`)
              return (
                <button
                  key={tab.key}
                  onClick={() => router.push(fullPath)}
                  className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-indigo-500 border-indigo-500'
                      : 'text-gray-400 border-transparent'
                  }`}
                >
                  {t(tab.key)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
