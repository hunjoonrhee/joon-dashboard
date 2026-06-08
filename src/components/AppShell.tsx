'use client'

import NavBar from '@/components/NavBar'
import Onboarding from '@/components/Onboarding'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [onboarding, setOnboarding] = useState<boolean | null>(null)

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
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
