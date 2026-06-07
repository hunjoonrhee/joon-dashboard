'use client'

import GoalsTab from '@/components/tabs/GoalsTab'
import { supabase } from '@/lib/supabase'
import type { Goal, Topic } from '@/types'
import { useEffect, useState } from 'react'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('goals').select('*'),
      supabase.from('topics').select('*'),
    ]).then(([g, t]) => {
      if (g.data) setGoals(g.data)
      if (t.data) setTopics(t.data)
    })
  }, [refreshKey])

  return (
    <main className="max-w-xl mx-auto px-4 py-4">
      <GoalsTab
        goals={goals}
        topics={topics}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </main>
  )
}
