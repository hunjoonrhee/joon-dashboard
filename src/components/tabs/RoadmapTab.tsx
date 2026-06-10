'use client'

import { goalStatusStyle } from '@/lib/statusConfig'
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { Goal, Session, Topic } from '@/types'
import {
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Map,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Modal from '../Modal'

interface CareerSkill {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
}

interface CareerStage {
  id: string
  title: string
  level: number
  description: string
  skills: CareerSkill[]
}

interface CareerPath {
  id: string
  title: string
  description: string
  icon: string
  stages: CareerStage[]
}

interface CareerData {
  paths: CareerPath[]
  categories: { id: string; label: string; color: string }[]
}

interface Props {
  goals: Goal[]
  topics: Topic[]
  sessions?: Session[]
  onRefresh: () => void
  settings?: Record<string, string>
}

const emptyForm = {
  name: '',
  description: '',
  status: 'in_progress' as Goal['status'],
  priority: 'medium' as Goal['priority'],
  is_focus: false,
}

type RoadmapView = 'my' | 'career' | 'gap'

export default function RoadmapTab({
  goals,
  topics,
  sessions = [],
  onRefresh,
  settings = {},
}: Props) {
  const router = useRouter()
  const t = useTranslations('goals')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<RoadmapView>('my')
  const [careerData, setCareerData] = useState<CareerData | null>(null)
  const [localPath, setLocalPath] = useState<string | null>(null)
  const [localStageLevel, setLocalStageLevel] = useState<number | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    fetch('/career-paths.json')
      .then((r) => r.json())
      .then((d: CareerData) => setCareerData(d))
  }, [])

  const selectedPath =
    localPath === '' ? null : (localPath ?? settings.career_path ?? null)
  const selectedStageLevel =
    localStageLevel ?? parseInt(settings.career_stage ?? '1')

  // 공부기록 태그 집계
  const studiedTags = new Set(sessions.flatMap((s) => s.tags))

  const sortedGoals = [...goals].sort((a, b) => {
    const statusOrder = { in_progress: 0, planned: 1, completed: 2 }
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status])
      return statusOrder[a.status] - statusOrder[b.status]
    return priorityOrder[a.priority] - priorityOrder[b.priority]
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
  const toggleGoal = (id: string) =>
    setOpenGoals((prev) => ({ ...prev, [id]: !prev[id] }))

  const open = (type: 'add' | 'edit', goal?: Goal) => {
    if (type === 'edit' && goal) {
      setSelected(goal)
      setForm({
        name: goal.name,
        description: goal.description ?? '',
        status: goal.status,
        priority: goal.priority,
        is_focus: goal.is_focus,
      })
    } else {
      setSelected(null)
      setForm(emptyForm)
    }
    setModal(type)
  }

  const close = () => {
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
    if (form.is_focus) {
      await supabase
        .from('goals')
        .update({ is_focus: false })
        .neq('id', selected?.id ?? '')
    }
    if (modal === 'add') {
      await supabase.from('goals').insert(payload)
    } else if (selected) {
      await supabase.from('goals').update(payload).eq('id', selected.id)
    }
    setSaving(false)
    close()
    onRefresh()
  }

  const remove = async () => {
    if (!selected) return
    await supabase.from('goals').delete().eq('id', selected.id)
    close()
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
    setLocalPath(pathId)
    setLocalStageLevel(stageLevel)
    onRefresh()
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== 'completed')
  const completedGoals = sortedGoals.filter((g) => g.status === 'completed')
  const finalGoal = settings.big_goal ?? '리드 아키텍트'

  const currentPath = careerData?.paths.find((p) => p.id === selectedPath)
  const currentStage = currentPath?.stages.find(
    (s) => s.level === selectedStageLevel
  )

  // 갭 분석
  const gapAnalysis =
    currentPath?.stages
      .filter((s) => s.level <= selectedStageLevel + 1)
      .map((stage) => ({
        stage,
        skills: stage.skills.map((skill) => ({
          skill,
          studied: skill.tags.some((tag) => studiedTags.has(tag)),
          matchedTags: skill.tags.filter((tag) => studiedTags.has(tag)),
        })),
      })) ?? []

  const totalSkills = gapAnalysis.flatMap((s) => s.skills).length
  const studiedSkills = gapAnalysis
    .flatMap((s) => s.skills)
    .filter((s) => s.studied).length
  const gapPct =
    totalSkills === 0 ? 0 : Math.round((studiedSkills / totalSkills) * 100)

  return (
    <>
      {/* 뷰 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setView('my')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === 'my' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
        >
          <Star size={13} /> 내 목표
        </button>
        <button
          onClick={() => setView('career')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === 'career' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
        >
          <Map size={13} /> 커리어 경로
        </button>
        <button
          onClick={() => setView('gap')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${view === 'gap' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
        >
          <BarChart2 size={13} /> 갭 분석
        </button>
      </div>

      {/* ===== 내 목표 뷰 ===== */}
      {view === 'my' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {finalGoal}까지
            </p>
            <button
              onClick={() => open('add')}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {activeGoals.map((g, idx) => {
            const goalTopics = getTopics(g.id)
            const categories = getCategories(g.id)
            const pct = getPct(g.id)
            const isOpen = openGoals[g.id] ?? false
            return (
              <div key={g.id}>
                {idx > 0 && (
                  <div className="flex justify-start pl-4 py-0.5">
                    <div className="w-px h-3 bg-gray-200" />
                  </div>
                )}
                <div
                  className={`bg-white rounded-xl border overflow-hidden ${g.status === 'in_progress' ? 'border-indigo-200' : g.status === 'completed' ? 'border-green-200' : 'border-gray-200'}`}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${g.status === 'completed' ? 'bg-green-400' : g.status === 'in_progress' ? 'bg-indigo-500' : 'bg-gray-200'}`}
                      />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`goals/${g.id}`)}
                      >
                        <div className="flex items-center gap-1.5">
                          {g.is_focus && (
                            <Star
                              size={11}
                              className="text-indigo-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                          <p
                            className={`text-sm font-semibold truncate ${g.status === 'completed' ? 'line-through text-gray-400' : g.status === 'planned' ? 'text-gray-400' : 'text-gray-800'}`}
                          >
                            {g.name}
                          </p>
                        </div>
                        {g.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {g.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {goalTopics.length > 0 && (
                          <span className="text-xs font-semibold text-indigo-500">
                            {pct}%
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${goalStatusStyle[g.status]}`}
                        >
                          {tStatus(g.status)}
                        </span>
                        <button
                          onClick={() => open('edit', g)}
                          className="text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        {goalTopics.length > 0 && (
                          <button
                            onClick={() => toggleGoal(g.id)}
                            className="text-gray-400"
                          >
                            {isOpen ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronRight size={15} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {goalTopics.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 ml-5">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${g.status === 'completed' ? 'bg-green-400' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300">
                          {goalTopics.filter((t) => t.completed).length}/
                          {goalTopics.length}
                        </span>
                      </div>
                    )}
                  </div>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-3">
                      {categories.map((cat) => {
                        const catTopics = goalTopics.filter(
                          (t) => t.category === cat
                        )
                        const catPct = getCatPct(g.id, cat)
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                {cat}
                              </span>
                              <span className="text-xs text-gray-400">
                                {catPct}%
                              </span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                              <div
                                className="h-full bg-indigo-400 rounded-full"
                                style={{ width: `${catPct}%` }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              {catTopics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center gap-2 cursor-pointer py-0.5"
                                  onClick={() => toggleTopic(topic)}
                                >
                                  <span
                                    className={`text-xs flex-shrink-0 w-4 ${topic.completed ? 'text-green-500' : 'text-indigo-400'}`}
                                  >
                                    {topic.completed ? '✓' : '○'}
                                  </span>
                                  <span
                                    className={`text-xs flex-1 ${topic.completed ? 'line-through text-gray-300' : 'text-gray-600'}`}
                                  >
                                    {topic.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div className="flex justify-start pl-4 py-0.5">
            <div className="w-px h-3 bg-gray-200" />
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-indigo-800">
                {finalGoal} 🎯
              </p>
              <p className="text-xs text-indigo-500 mt-0.5">
                {t('finalGoalSub')}
              </p>
            </div>
          </div>

          {completedGoals.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
                {t('completedGoals')} ({completedGoals.length})
              </button>
              {showCompleted && (
                <div className="flex flex-col gap-2 mt-2">
                  {completedGoals.map((g) => {
                    const goalTopics = getTopics(g.id)
                    const pct = getPct(g.id)
                    return (
                      <div
                        key={g.id}
                        className="bg-white rounded-xl border border-green-100 overflow-hidden opacity-70"
                      >
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => router.push(`goals/${g.id}`)}
                            >
                              <p className="text-sm font-semibold line-through text-gray-400 truncate">
                                {g.name}
                              </p>
                              {g.description && (
                                <p className="text-xs text-gray-300 mt-0.5 truncate">
                                  {g.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {goalTopics.length > 0 && (
                                <span className="text-xs font-semibold text-green-500">
                                  {pct}%
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                                완료
                              </span>
                              <button
                                onClick={() => open('edit', g)}
                                className="text-gray-300 hover:text-indigo-500 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                          </div>
                          {goalTopics.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 ml-5">
                              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-400 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-300">
                                {goalTopics.filter((t) => t.completed).length}/
                                {goalTopics.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 커리어 경로 뷰 ===== */}
      {view === 'career' && (
        <div className="flex flex-col gap-4">
          {!careerData ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : !selectedPath ? (
            <>
              <p className="text-sm font-semibold text-gray-700">
                커리어 경로를 선택해봐
              </p>
              <p className="text-xs text-gray-400 mb-2">
                선택하면 공부 방향과 갭 분석이 자동으로 제안돼.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {careerData.paths.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => saveCareerPath(path.id, 1)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xl">{path.icon}</span>
                      <p className="text-sm font-bold text-gray-800">
                        {path.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed pl-8">
                      {path.description}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-2 pl-8">
                      {path.stages.map((stage) => (
                        <span
                          key={stage.id}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                        >
                          {stage.title}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* 선택된 경로 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentPath?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {currentPath?.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      현재 단계: {currentStage?.title}
                    </p>
                    {currentPath && (
                      <p className="text-xs text-indigo-400 mt-0.5">
                        최종 단계:{' '}
                        {
                          currentPath.stages[currentPath.stages.length - 1]
                            .title
                        }
                        {' → '}
                        <span className="text-indigo-600 font-medium">
                          {finalGoal}
                        </span>{' '}
                        🎯
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setLocalPath('')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft size={13} /> 목록으로
                </button>
              </div>

              {/* 단계 선택 */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {currentPath?.stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => saveCareerPath(selectedPath, stage.level)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedStageLevel === stage.level
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {stage.title}
                  </button>
                ))}
              </div>

              {/* 현재 단계 스킬 목록 */}
              {currentStage && (
                <div className="flex flex-col gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">
                      {currentStage.title}
                    </p>
                    <p className="text-xs text-indigo-500 leading-relaxed">
                      {currentStage.description}
                    </p>
                  </div>
                  {currentStage.skills.map((skill) => {
                    const isStudied = skill.tags.some((tag) =>
                      studiedTags.has(tag)
                    )
                    return (
                      <div
                        key={skill.id}
                        className={`bg-white rounded-xl border p-3 ${isStudied ? 'border-green-200' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-xs ${isStudied ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-400'}`}
                          >
                            {isStudied ? '✓' : '○'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold ${isStudied ? 'text-green-700' : 'text-gray-800'}`}
                            >
                              {skill.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                              {skill.description}
                            </p>
                            <div className="flex gap-1 flex-wrap mt-1.5">
                              {skill.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${studiedTags.has(tag) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== 갭 분석 뷰 ===== */}
      {view === 'gap' && (
        <div className="flex flex-col gap-4">
          {!selectedPath ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-3xl opacity-30">📊</span>
              <p className="text-sm font-semibold text-gray-700">
                커리어 경로를 먼저 선택해야 해
              </p>
              <button
                onClick={() => setView('career')}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
              >
                커리어 경로 선택하러 가기
              </button>
            </div>
          ) : (
            <>
              {/* 전체 진행도 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-700">
                    공부 방향 일치도
                  </p>
                  <span
                    className={`text-lg font-bold ${gapPct >= 70 ? 'text-green-500' : gapPct >= 40 ? 'text-amber-500' : 'text-red-400'}`}
                  >
                    {gapPct}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${gapPct >= 70 ? 'bg-green-400' : gapPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${gapPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {studiedSkills}/{totalSkills}개 역량 공부 기록 있음 ·{' '}
                  {currentPath?.title} · {currentStage?.title}
                </p>
              </div>

              {/* 카테고리별 갭 */}
              {gapAnalysis.map(({ stage, skills }) => {
                const stageDone = skills.filter((s) => s.studied).length
                const stagePct =
                  skills.length === 0
                    ? 0
                    : Math.round((stageDone / skills.length) * 100)
                return (
                  <div
                    key={stage.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-600">
                        {stage.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {stageDone}/{skills.length}
                        </span>
                        <span
                          className={`text-xs font-bold ${stagePct >= 70 ? 'text-green-500' : stagePct >= 40 ? 'text-amber-500' : 'text-gray-400'}`}
                        >
                          {stagePct}%
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 flex flex-col gap-2">
                      {skills.map(({ skill, studied, matchedTags }) => (
                        <div
                          key={skill.id}
                          className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${studied ? 'bg-green-400' : 'bg-gray-200'}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium ${studied ? 'text-green-700' : 'text-gray-600'}`}
                            >
                              {skill.name}
                            </p>
                            {!studied && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                필요 태그: {skill.tags.slice(0, 3).join(', ')}
                              </p>
                            )}
                            {studied && matchedTags.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {matchedTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* 목표 추가/수정 모달 */}
      {modal && (
        <Modal
          title={modal === 'add' ? t('addModal') : t('editModal')}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>{t('name')}</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: Angular Level 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('description')}</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: 6월 재시험"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelCls}>{t('priority')}</label>
                <select
                  className={inputCls}
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as Goal['priority'],
                    })
                  }
                >
                  <option value="urgent">{tPriority('urgent')}</option>
                  <option value="high">{tPriority('high')}</option>
                  <option value="medium">{tPriority('medium')}</option>
                  <option value="low">{tPriority('low')}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={labelCls}>{t('status')}</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Goal['status'],
                    })
                  }
                >
                  <option value="in_progress">{tStatus('in_progress')}</option>
                  <option value="completed">{tStatus('completed')}</option>
                  <option value="planned">{tStatus('planned')}</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_focus"
                checked={form.is_focus}
                onChange={(e) =>
                  setForm({ ...form, is_focus: e.target.checked })
                }
              />
              <label htmlFor="is_focus" className="text-sm text-gray-600">
                {t('focus')}
              </label>
            </div>
          </div>
          <div className="flex justify-between pt-1">
            {modal === 'edit' ? (
              <button
                onClick={remove}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button onClick={close} className={cancelBtnCls}>
                {tCommon('cancel')}
              </button>
              <button onClick={save} disabled={saving} className={saveBtnCls}>
                {saving ? tCommon('saving') : tCommon('save')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
