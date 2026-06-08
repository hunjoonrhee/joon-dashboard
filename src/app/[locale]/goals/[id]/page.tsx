'use client'

import { supabase } from '@/lib/supabase'
import type { Goal, Topic } from '@/types'
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const priorityStyle: Record<Goal['priority'], string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-500',
}

const priorityLabel: Record<Goal['priority'], string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const statusLabel: Record<Goal['status'], string> = {
  in_progress: '진행 중',
  completed: '완료',
  planned: '예정',
}

const statusStyle: Record<Goal['status'], string> = {
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  planned: 'bg-gray-100 text-gray-500',
}

export default function GoalDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [newTopic, setNewTopic] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addingTopic, setAddingTopic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoDraft, setInfoDraft] = useState({
    name: '',
    description: '',
    status: 'in_progress' as Goal['status'],
    priority: 'medium' as Goal['priority'],
    is_focus: false,
  })

  useEffect(() => {
    const fetch = async () => {
      const [{ data: g }, { data: t }] = await Promise.all([
        supabase.from('goals').select('*').eq('id', id).single(),
        supabase
          .from('topics')
          .select('*')
          .eq('goal_id', id)
          .order('created_at'),
      ])
      if (g) {
        setGoal(g)
        setInfoDraft({
          name: g.name,
          description: g.description ?? '',
          status: g.status,
          priority: g.priority,
          is_focus: g.is_focus,
        })
      }
      if (t) setTopics(t)
      setLoading(false)
    }
    fetch()
  }, [id])

  const saveInfo = async () => {
    if (!goal) return
    setSaving(true)
    if (infoDraft.is_focus) {
      await supabase
        .from('goals')
        .update({ is_focus: false })
        .neq('id', goal.id)
    }
    await supabase.from('goals').update(infoDraft).eq('id', goal.id)
    setGoal({ ...goal, ...infoDraft })
    setSaving(false)
    setEditingInfo(false)
  }

  const cancelInfo = () => {
    setInfoDraft({
      name: goal?.name ?? '',
      description: goal?.description ?? '',
      status: goal?.status ?? 'in_progress',
      priority: goal?.priority ?? 'medium',
      is_focus: goal?.is_focus ?? false,
    })
    setEditingInfo(false)
  }

  const addTopic = async () => {
    if (!newTopic.trim() || !goal) return
    setSaving(true)
    const { data } = await supabase
      .from('topics')
      .insert({
        name: newTopic.trim(),
        category: newCategory.trim() || 'general',
        goal_id: goal.id,
        completed: false,
      })
      .select()
      .single()
    if (data) setTopics((prev) => [...prev, data])
    setNewTopic('')
    setNewCategory('')
    setAddingTopic(false)
    setSaving(false)
  }

  const toggleTopic = async (topic: Topic) => {
    await supabase
      .from('topics')
      .update({ completed: !topic.completed })
      .eq('id', topic.id)
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id ? { ...t, completed: !t.completed } : t
      )
    )
  }

  const removeTopic = async (topic: Topic) => {
    await supabase.from('topics').delete().eq('id', topic.id)
    setTopics((prev) => prev.filter((t) => t.id !== topic.id))
  }

  const categories = [...new Set(topics.map((t) => t.category))]

  const getPct = (cat: string) => {
    const filtered = topics.filter((t) => t.category === cat)
    if (filtered.length === 0) return 0
    return Math.round(
      (filtered.filter((t) => t.completed).length / filtered.length) * 100
    )
  }

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    )

  if (!goal)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">목표를 찾을 수 없어요.</p>
      </main>
    )

  return (
    <main className="mx-auto px-4 py-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">뒤로</span>
      </button>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">기본 정보</p>
            {!editingInfo ? (
              <button
                onClick={() => {
                  setInfoDraft({
                    name: goal.name,
                    description: goal.description ?? '',
                    status: goal.status,
                    priority: goal.priority,
                    is_focus: goal.is_focus,
                  })
                  setEditingInfo(true)
                }}
                className="text-gray-400 hover:text-indigo-500 transition-colors"
              >
                <Pencil size={15} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelInfo}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={15} />
                </button>
                <button
                  onClick={saveInfo}
                  disabled={saving}
                  className="text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Check size={15} />
                </button>
              </div>
            )}
          </div>

          {editingInfo ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  목표 이름
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  value={infoDraft.name}
                  onChange={(e) =>
                    setInfoDraft({ ...infoDraft, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">설명</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  value={infoDraft.description}
                  onChange={(e) =>
                    setInfoDraft({ ...infoDraft, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    우선순위
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={infoDraft.priority}
                    onChange={(e) =>
                      setInfoDraft({
                        ...infoDraft,
                        priority: e.target.value as Goal['priority'],
                      })
                    }
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    상태
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={infoDraft.status}
                    onChange={(e) =>
                      setInfoDraft({
                        ...infoDraft,
                        status: e.target.value as Goal['status'],
                      })
                    }
                  >
                    <option value="in_progress">진행 중</option>
                    <option value="completed">완료</option>
                    <option value="planned">예정</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_focus"
                  checked={infoDraft.is_focus}
                  onChange={(e) =>
                    setInfoDraft({ ...infoDraft, is_focus: e.target.checked })
                  }
                />
                <label htmlFor="is_focus" className="text-sm text-gray-600">
                  현재 집중 목표로 설정
                </label>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {goal.name}
                </h1>
                {goal.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {goal.description}
                  </p>
                )}
                {goal.is_focus && (
                  <p className="text-xs text-indigo-500 mt-2 font-medium">
                    ★ 현재 집중 목표
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle[goal.priority]}`}
                >
                  {priorityLabel[goal.priority]}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[goal.status]}`}
                >
                  {statusLabel[goal.status]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 서브태스크 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">서브태스크</p>
            <button
              onClick={() => setAddingTopic(true)}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {addingTopic && (
            <div className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                placeholder="항목 이름..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTopic()
                }}
              />
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                placeholder="카테고리 (예: theory, coding)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setAddingTopic(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={addTopic}
                  disabled={saving}
                  className="text-indigo-500 hover:text-indigo-700 disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}

          {topics.length === 0 && !addingTopic ? (
            <p className="text-sm text-gray-400">
              + 버튼으로 서브태스크를 추가해봐.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.map((cat) => {
                const pct = getPct(cat)
                const catTopics = topics.filter((t) => t.category === cat)
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-medium">{cat}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {catTopics.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            onClick={() => toggleTopic(t)}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${t.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}
                            >
                              {t.completed && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <span
                              className={`text-sm truncate ${t.completed ? 'line-through text-gray-300' : 'text-gray-700'}`}
                            >
                              {t.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeTopic(t)}
                            className="text-gray-300 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
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
    </main>
  )
}
