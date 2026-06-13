'use client'

import { useUser } from '@/components/UserProvider'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { AiRoadmap, Goal, Session, Topic } from '@/types'
import { BarChart2, Route, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import AiRoadmapView from './roadmap/AiRoadmapView'
import GapAnalysisView from './roadmap/GapAnalysisView'
import GoalModal from './roadmap/GoalModal'
import MyGoalsView from './roadmap/MyGoalsView'

interface Props {
  goals: Goal[]
  topics: Topic[]
  sessions?: Session[]
  onRefresh: () => void
  settings?: Record<string, string>
}

type RoadmapView = 'my' | 'ai' | 'gap'

export default function RoadmapTab({
  goals,
  topics,
  sessions = [],
  onRefresh,
  settings = {},
}: Props) {
  const { show } = useToast()
  const t = useTranslations('roadmap')
  const user = useUser()
  const [modal, setModal] = useState<{
    mode: 'add' | 'edit'
    goal?: Goal
  } | null>(null)
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({})
  const [showCompleted, setShowCompleted] = useState(false)
  const [view, setView] = useState<RoadmapView>('my')
  const [adoptedRoadmap, setAdoptedRoadmap] = useState<AiRoadmap | null>(null)

  useEffect(() => {
    const adoptedId = settings.adopted_roadmap_id
    if (!adoptedId) return
    supabase
      .from('ai_roadmaps')
      .select('*')
      .eq('id', adoptedId)
      .single()
      .then(({ data }) => {
        if (data) setAdoptedRoadmap(data as AiRoadmap)
      })
  }, [settings.adopted_roadmap_id])

  const studiedTags = new Set([
    ...sessions.flatMap((s) => s.tags),
    ...goals.flatMap((g) => g.tags ?? []),
  ])
  const finalGoal = settings.big_goal ?? '리드 아키텍트'
  const adoptedRoadmapTags = adoptedRoadmap
    ? [
        ...new Set(
          adoptedRoadmap.stages.flatMap((s) =>
            s.skills.flatMap((sk) => sk.tags)
          )
        ),
      ]
    : []

  const sortedGoals = [...goals].sort((a, b) => {
    const so = { in_progress: 0, planned: 1, completed: 2 }
    const po = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status]
    return po[a.priority] - po[b.priority]
  })

  const getTopics = (goalId: string) =>
    topics.filter((t) => t.goal_id === goalId)
  const getCategories = (goalId: string) => [
    ...new Set(getTopics(goalId).map((t) => t.category)),
  ]
  const getPct = (goalId: string) => {
    const t = getTopics(goalId)
    if (t.length === 0) return 0
    return Math.round((t.filter((t) => t.completed).length / t.length) * 100)
  }
  const getCatPct = (goalId: string, cat: string) => {
    const t = getTopics(goalId).filter((t) => t.category === cat)
    if (t.length === 0) return 0
    return Math.round((t.filter((t) => t.completed).length / t.length) * 100)
  }

  const toggleTopic = async (topic: Topic) => {
    await supabase
      .from('topics')
      .update({ completed: !topic.completed })
      .eq('id', topic.id)
    onRefresh()
  }

  const handleAdopt = async (roadmap: AiRoadmap) => {
    try {
      await Promise.all([
        supabase
          .from('settings')
          .upsert(
            { key: 'adopted_roadmap_id', value: roadmap.id, user_id: user?.id },
            { onConflict: 'key' }
          ),
        supabase
          .from('settings')
          .upsert(
            { key: 'big_goal', value: roadmap.goal, user_id: user?.id },
            { onConflict: 'key' }
          ),
        supabase
          .from('settings')
          .upsert(
            { key: 'big_goal_sub', value: roadmap.career_level, user_id: user?.id },
            { onConflict: 'key' }
          ),
      ])
      setAdoptedRoadmap(roadmap)
      show(t('roadmapAdopted') ?? '로드맵이 채택됐어 ✓', {
        type: 'success',
        sub: `${roadmap.goal} · ${roadmap.career_level}`,
      })
      onRefresh()
    } catch {
      show('저장에 실패했어', { type: 'error' })
    }
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== 'completed')
  const completedGoals = sortedGoals.filter((g) => g.status === 'completed')

  const tabs = [
    { key: 'my' as RoadmapView, icon: <Star size={13} />, label: t('myGoals') },
    {
      key: 'ai' as RoadmapView,
      icon: <Route size={13} />,
      label: t('aiRoadmap'),
    },
    {
      key: 'gap' as RoadmapView,
      icon: <BarChart2 size={13} />,
      label: t('gapAnalysis'),
    },
  ]

  return (
    <>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {view === 'my' && (
        <MyGoalsView
          activeGoals={activeGoals}
          completedGoals={completedGoals}
          finalGoal={finalGoal}
          openGoals={openGoals}
          showCompleted={showCompleted}
          adoptedRoadmap={adoptedRoadmap}
          getTopics={getTopics}
          getCategories={getCategories}
          getPct={getPct}
          getCatPct={getCatPct}
          onToggleGoal={(id) =>
            setOpenGoals((prev) => ({ ...prev, [id]: !prev[id] }))
          }
          onToggleTopic={toggleTopic}
          onEdit={(goal) => setModal({ mode: 'edit', goal })}
          onAdd={() => setModal({ mode: 'add' })}
          onToggleCompleted={() => setShowCompleted((v) => !v)}
        />
      )}
      {view === 'ai' && (
        <AiRoadmapView
          adoptedRoadmap={adoptedRoadmap}
          settings={settings}
          onAdopt={handleAdopt}
          onRefresh={onRefresh}
        />
      )}
      {view === 'gap' && (
        <GapAnalysisView
          adoptedRoadmap={adoptedRoadmap}
          studiedTags={studiedTags}
          onGoToAi={() => setView('ai')}
        />
      )}
      {modal && (
        <GoalModal
          mode={modal.mode}
          goal={modal.goal}
          tagPool={adoptedRoadmapTags}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}
