'use client'

import { supabase } from '@/lib/supabase'
import type { CareerData, Goal, Session, Topic } from '@/types'
import { BarChart2, Map, Star } from 'lucide-react'
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

const emptyForm = {
  name: '',
  description: '',
  status: 'in_progress' as Goal['status'],
  priority: 'medium' as Goal['priority'],
  is_focus: false,
}

export default function RoadmapTab({
  goals,
  topics,
  sessions = [],
  onRefresh,
  settings = {},
}: Props) {
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({})
  const [showCompleted, setShowCompleted] = useState(false)
  const [view, setView] = useState<RoadmapView>('my')
  const [careerData, setCareerData] = useState<CareerData | null>(null)
  const [localPath, setLocalPath] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('roadmap_local_path')
  })
  const [localStageLevel, setLocalStageLevel] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const v = sessionStorage.getItem('roadmap_local_stage')
    return v ? parseInt(v) : null
  })

  useEffect(() => {
    fetch('/career-paths.json')
      .then((r) => r.json())
      .then((d: CareerData) => setCareerData(d))
  }, [])

  // sessionStorage로 로컬 상태 유지
  const selectedPath =
    localPath === '' ? null : (localPath ?? settings.career_path ?? null)
  const selectedStageLevel =
    localStageLevel ?? parseInt(settings.career_stage ?? '1')
  const studiedTags = new Set(sessions.flatMap((s) => s.tags))
  const finalGoal = settings.big_goal ?? '리드 아키텍트'

  const sortedGoals = [...goals].sort((a, b) => {
    const so = { in_progress: 0, planned: 1, completed: 2 }
    const po = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status]
    return po[a.priority] - po[b.priority]
  })

  const handleSetLocalPath = (val: string | null) => {
    if (val === null) {
      sessionStorage.removeItem('roadmap_local_path')
    } else {
      sessionStorage.setItem('roadmap_local_path', val)
    }
    setLocalPath(val)
  }

  const handleSetLocalStageLevel = (val: number | null) => {
    if (val === null) {
      sessionStorage.removeItem('roadmap_local_stage')
    } else {
      sessionStorage.setItem('roadmap_local_stage', String(val))
    }
    setLocalStageLevel(val)
  }

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

  const openModal = (type: 'add' | 'edit', goal?: Goal) => {
    setSelected(goal ?? null)
    setForm(
      goal
        ? {
            name: goal.name,
            description: goal.description ?? '',
            status: goal.status,
            priority: goal.priority,
            is_focus: goal.is_focus,
          }
        : emptyForm
    )
    setModal(type)
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    setForm(emptyForm)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      is_focus: form.is_focus,
    }
    if (form.is_focus)
      await supabase
        .from('goals')
        .update({ is_focus: false })
        .neq('id', selected?.id ?? '')
    if (modal === 'add') await supabase.from('goals').insert(payload)
    else if (selected)
      await supabase.from('goals').update(payload).eq('id', selected.id)
    setSaving(false)
    closeModal()
    onRefresh()
  }

  const remove = async () => {
    if (!selected) return
    await supabase.from('goals').delete().eq('id', selected.id)
    closeModal()
    onRefresh()
  }

  const toggleTopic = async (topic: Topic) => {
    await supabase
      .from('topics')
      .update({ completed: !topic.completed })
      .eq('id', topic.id)
    onRefresh()
  }

  const saveCareerPath = async (pathId: string, stageLevel: number) => {
    await Promise.all([
      supabase.from('settings').upsert({ key: 'career_path', value: pathId }),
      supabase
        .from('settings')
        .upsert({ key: 'career_stage', value: String(stageLevel) }),
    ])
    handleSetLocalPath(pathId)
    handleSetLocalStageLevel(stageLevel)
    onRefresh()
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== 'completed')
  const completedGoals = sortedGoals.filter((g) => g.status === 'completed')

  const tabs: { key: RoadmapView; icon: React.ReactNode; label: string }[] = [
    { key: 'my', icon: <Star size={13} />, label: '내 목표' },
    { key: 'career', icon: <Map size={13} />, label: '커리어 경로' },
    { key: 'gap', icon: <BarChart2 size={13} />, label: '갭 분석' },
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
          onEdit={(goal) => openModal('edit', goal)}
          onAdd={() => openModal('add')}
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
          mode={modal}
          form={form}
          saving={saving}
          onChange={setForm}
          onSave={save}
          onDelete={modal === 'edit' ? remove : undefined}
          onClose={closeModal}
        />
      )}
    </>
  )
}
