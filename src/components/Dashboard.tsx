'use client'

import { supabase } from '@/lib/supabase'
import type { Goal, Session, Setting, Topic } from '@/types'
import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import FocusGoal from './FocusGoal'
import GoalList from './GoalList'
import SessionLog from './SessionLog'
import TopCards from './TopCards'

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const router = useRouter()

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    const fetchData = async () => {
      const [s, t, g, st] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: false }),
        supabase.from('topics').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('settings').select('*'),
      ])
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
      setLoading(false)
    }
    fetchData()
  }, [refreshKey])

  useEffect(() => {
    const handleFocus = () => setRefreshKey((k) => k + 1)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          {settings.name ?? 'Joon'}의 성장 대시보드
        </h1>
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
            <Settings size={18} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <TopCards sessions={sessions} topics={topics} settings={settings} />
        <FocusGoal topics={topics} goals={goals} onRefresh={refresh} />
        <GoalList goals={goals} onRefresh={refresh} />
        <SessionLog sessions={sessions} onRefresh={refresh} />
      </div>
    </main>
  )
}
