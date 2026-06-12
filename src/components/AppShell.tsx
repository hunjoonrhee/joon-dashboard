'use client'

import AddSessionModal from '@/components/AddSessionModal'
import NavBar from '@/components/NavBar'
import Onboarding from '@/components/Onboarding'
import Sidebar from '@/components/Sidebar'
import GoalModal from '@/components/tabs/roadmap/GoalModal'
import { ToastProvider } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const pageTitles: Record<string, string> = {
    '': tNav('home'),
    study: tNav('study'),
    notes: tNav('notes'),
    roadmap: tNav('roadmap'),
    projects: tNav('projects'),
    settings: tNav('settings'),
  }
  const [onboarding, setOnboarding] = useState<boolean | null>(null)
  const [showStudyModal, setShowStudyModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const locale = pathname.split('/')[1] ?? 'ko'
  const segment = pathname.split('/')[2] ?? ''
  const pageTitle = pageTitles[segment] ?? ''

  const today =
    typeof window !== 'undefined'
      ? new Date().toLocaleDateString(
          locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
        )
      : ''

  const headerButtonConfig: Record<
    string,
    { label: string; modal: 'study' | 'goal' | 'project' | false }
  > = {
    '': { label: `+ ${tNav('study')}`, modal: 'study' },
    study: { label: `+ ${tNav('study')}`, modal: 'study' },
    notes: { label: `+ ${tCommon('add')} ${tNav('notes')}`, modal: false },
    roadmap: { label: `+ ${tNav('goals')}`, modal: 'goal' },
    projects: { label: `+ ${tNav('projects')}`, modal: 'project' },
    settings: { label: `+ ${tNav('study')}`, modal: 'study' },
  }

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

  const btnConfig = headerButtonConfig[segment] ?? headerButtonConfig['']

  const handleHeaderBtn = () => {
    if (btnConfig.modal === 'study') setShowStudyModal(true)
    else if (btnConfig.modal === 'goal') setShowGoalModal(true)
    else if (btnConfig.modal === 'project') router.push(pathname + '?add=true')
  }

  if (onboarding === null) return null

  if (onboarding) {
    return (
      <ToastProvider>
        <Onboarding onComplete={() => setOnboarding(false)} />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
          <NavBar />
          <div className="hidden lg:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
            <h1 className="text-base font-bold text-gray-800">{pageTitle}</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400" suppressHydrationWarning>
                {today}
              </span>
              <button
                onClick={handleHeaderBtn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
              >
                {btnConfig.label}
              </button>
            </div>
          </div>
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>

        {showStudyModal && (
          <AddSessionModal
            onClose={() => setShowStudyModal(false)}
            onSaved={() => setShowStudyModal(false)}
          />
        )}

        {showGoalModal && (
          <GoalModal
            mode="add"
            onClose={() => setShowGoalModal(false)}
            onSaved={() => setShowGoalModal(false)}
          />
        )}
      </div>
    </ToastProvider>
  )
}
