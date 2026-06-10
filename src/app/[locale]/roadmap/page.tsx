'use client'

import RoadmapTab from '@/components/tabs/RoadmapTab'
import { supabase } from '@/lib/supabase'
import type { Goal, Session, Setting, Topic } from '@/types'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function RoadmapPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const didClean = useRef(false)

  const initialOpenAdd = searchParams.get('action') === 'add'

  useEffect(() => {
    if (initialOpenAdd && !didClean.current) {
      didClean.current = true
      router.replace(pathname)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('goals').select('*'),
      supabase.from('topics').select('*'),
      supabase.from('sessions').select('*').order('date', { ascending: false }),
      supabase.from('settings').select('*'),
    ]).then(([g, t, s, st]) => {
      if (g.data) setGoals(g.data)
      if (t.data) setTopics(t.data)
      if (s.data) setSessions(s.data)
      if (st.data) {
        const map: Record<string, string> = {}
        st.data.forEach((s: Setting) => {
          map[s.key] = s.value
        })
        setSettings(map)
      }
    })
  }, [refreshKey])

  return (
    <main className="mx-auto px-4 py-4">
      <RoadmapTab
        goals={goals}
        topics={topics}
        sessions={sessions}
        settings={settings}
        initialOpenAdd={initialOpenAdd}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </main>
  )
}
