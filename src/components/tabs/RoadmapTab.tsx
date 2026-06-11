'use client'

import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { CareerData, Goal, Session, Topic } from '@/types'
import { BarChart2, Map, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import CareerPathView from './roadmap/CareerPathView'
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

type RoadmapView = 'my' | 'career' | 'gap'

export default function RoadmapTab({
  goals,
  topics,
  sessions = [],
  onRefresh,
  settings = {},
}: Props) {
  const { show } = useToast()
  const t = useTranslations('roadmap')
  const [modal, setModal] = useState<{
    mode: 'add' | 'edit'
    goal?: Goal
  } | null>(null)
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({})
  const [showCompleted, setShowCompleted] = useState(false)
  const [view, setView] = useState<RoadmapView>('my')
  const [careerData, setCareerData] = useState<CareerData | null>(null)
  const [localPath, setLocalPath] = useState<string | null>(null)
  const [localStageLevel, setLocalStageLevel] = useState<number | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    fetch('/career-paths.json')
      .then((r) => r.json())
      .then((d: CareerData) => setCareerData(d))
  }, [])

  useEffect(() => {
    if (!settingsLoaded && (settings.career_path || settings.career_stage)) {
      setLocalPath(settings.career_path ?? null)
      setLocalStageLevel(parseInt(settings.career_stage ?? '1'))
      setSettingsLoaded(true)
    }
  }, [settings.career_path, settings.career_stage, settingsLoaded])

  const selectedPath = localPath === '' ? null : localPath
  const selectedStageLevel = localStageLevel ?? 1
  const studiedTags = new Set(sessions.flatMap((s) => s.tags))
  const finalGoal = settings.big_goal ?? '리드 아키텍트'

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

  const saveCareerPath = async (pathId: string, stageLevel: number) => {
    try {
      await Promise.all([
        supabase
          .from('settings')
          .upsert({ key: 'career_path', value: pathId }, { onConflict: 'key' }),
        supabase
          .from('settings')
          .upsert(
            { key: 'career_stage', value: String(stageLevel) },
            { onConflict: 'key' }
          ),
      ])
      setLocalPath(pathId)
      setLocalStageLevel(stageLevel)
      const path = careerData?.paths.find((p) => p.id === pathId)
      const stage = path?.stages.find((s) => s.level === stageLevel)
      show(t('careerSaved') ?? '저장됐어 ✓', {
        type: 'success',
        sub: `${path?.title} · ${stage?.title}`,
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
      key: 'career' as RoadmapView,
      icon: <Map size={13} />,
      label: t('careerPath'),
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
      {view === 'career' && (
        <CareerPathView
          careerData={careerData}
          selectedPath={selectedPath}
          selectedStageLevel={selectedStageLevel}
          studiedTags={studiedTags}
          finalGoal={finalGoal}
          onSelectPath={saveCareerPath}
          onSelectStage={(level) => saveCareerPath(selectedPath!, level)}
          onBack={() => setLocalPath('')}
        />
      )}
      {view === 'gap' && (
        <GapAnalysisView
          careerData={careerData}
          selectedPath={selectedPath}
          selectedStageLevel={selectedStageLevel}
          studiedTags={studiedTags}
          onGoToCareer={() => setView('career')}
        />
      )}
      {modal && (
        <GoalModal
          mode={modal.mode}
          goal={modal.goal}
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
