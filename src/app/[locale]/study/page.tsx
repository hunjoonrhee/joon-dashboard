'use client'

import StudyTab from '@/components/tabs/StudyTab'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/types'
import { useEffect, useState } from 'react'

export default function StudyPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data)
      })
  }, [refreshKey])

  return (
    <main className="mx-auto px-4 py-4">
      <StudyTab
        sessions={sessions}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </main>
  )
}
