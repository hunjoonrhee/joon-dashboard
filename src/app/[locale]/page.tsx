'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import HomeTab from '@/components/tabs/HomeTab'
import type {
  Session,
  Topic,
  Goal,
  Setting,
  TodayItem,
  ProjectTask,
  Note,
} from '@/types'

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [todayItems, setTodayItems] = useState<TodayItem[]>([])
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('sessions').select('*').order('date', { ascending: false }),
      supabase.from('topics').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('settings').select('*'),
      supabase
        .from('today_items')
        .select('*')
        .eq('date', today)
        .order('created_at'),
      supabase.from('project_tasks').select('*').eq('status', 'in_progress'),
      supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3),
    ]).then(([s, t, g, st, ti, pt, n]) => {
      if (s.data) setSessions(s.data)
      if (t.data) setTopics(t.data)
      if (g.data) setGoals(g.data)
      if (st.data) {
        const map: Record<string, string> = {}
        st.data.forEach((s: Setting) => {
          map[s.key] = s.value
        })
        setSettings(map)
      }
      if (ti.data) setTodayItems(ti.data)
      if (pt.data) setProjectTasks(pt.data)
      if (n.data) setNotes(n.data)
    })
  }, [refreshKey])

  return (
    <main className="px-6 py-6">
      <HomeTab
        sessions={sessions}
        topics={topics}
        goals={goals}
        settings={settings}
        todayItems={todayItems}
        projectTasks={projectTasks}
        notes={notes}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </main>
  )
}
