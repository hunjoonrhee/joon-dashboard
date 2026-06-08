'use client'

import RoadmapTab from '@/components/tabs/RoadmapTab'
import { supabase } from '@/lib/supabase'
import type { Goal, Setting, Topic } from '@/types'
import { useEffect, useState } from 'react'

export default function RoadmapPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('goals').select('*'),
      supabase.from('topics').select('*'),
      supabase.from('settings').select('*'),
    ]).then(([g, t, st]) => {
      if (g.data) setGoals(g.data)
      if (t.data) setTopics(t.data)
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
    <main className="max-w-xl mx-auto px-4 py-4">
      <RoadmapTab
        goals={goals}
        topics={topics}
        settings={settings}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </main>
  )
}
