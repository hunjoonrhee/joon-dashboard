'use client'

import AddSessionModal from '@/components/AddSessionModal'
import NavBar from '@/components/NavBar'
import Onboarding from '@/components/Onboarding'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, string> = {
  '': '홈',
  study: '공부 기록',
  notes: '노트',
  roadmap: '로드맵',
  projects: '프로젝트',
  settings: '설정',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [onboarding, setOnboarding] = useState<boolean | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const pathname = usePathname()

  const locale = pathname.split('/')[1] ?? 'ko'
  const segment = pathname.split('/')[2] ?? ''
  const pageTitle = pageTitles[segment] ?? ''

  const today = new Date().toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
  )

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'onboarding_completed')
      .single()
      .then(({ data }) => {
        setOnboarding(data?.value !== 'true')
      })
  }, [])

  if (onboarding === null) return null

  if (onboarding) {
    return <Onboarding onComplete={() => setOnboarding(false)} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <NavBar />

        {/* 데스크탑 헤더 */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-base font-bold text-gray-800">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{today}</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
            >
              + 기록 추가
            </button>
          </div>
        </div>

        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      {showAddModal && (
        <AddSessionModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
