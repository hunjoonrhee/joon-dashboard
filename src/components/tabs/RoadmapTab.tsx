'use client'

import { goalStatusStyle, priorityStyle } from '@/lib/statusConfig'
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { Goal, Topic } from '@/types'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Modal from '../Modal'

interface Props {
  goals: Goal[]
  topics: Topic[]
  onRefresh: () => void
}

const emptyForm = {
  name: '',
  description: '',
  status: 'in_progress' as Goal['status'],
  priority: 'medium' as Goal['priority'],
  is_focus: false,
}

export default function RoadmapTab({ goals, topics, onRefresh }: Props) {
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

  const sortedGoals = [...goals].sort((a, b) => {
    const statusOrder = { in_progress: 0, planned: 1, completed: 2 }
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status])
      return statusOrder[a.status] - statusOrder[b.status]
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const getTopics = (goalId: string) =>
    topics.filter((t) => t.goal_id === goalId)
  const getPct = (goalId: string) => {
    const t = getTopics(goalId)
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

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            로드맵
          </p>
          <button
            onClick={() => open('add')}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {sortedGoals.map((g, idx) => {
          const goalTopics = getTopics(g.id)
          const pct = getPct(g.id)
          const isOpen = openGoals[g.id] ?? false

          return (
            <div key={g.id}>
              {/* 연결선 */}
              {idx > 0 && (
                <div className="flex justify-start pl-4 py-1">
                  <div className="w-px h-4 bg-gray-200" />
                </div>
              )}

              <div
                className={`bg-white rounded-xl border overflow-hidden ${
                  g.status === 'in_progress'
                    ? 'border-indigo-200'
                    : g.status === 'completed'
                      ? 'border-green-200'
                      : 'border-gray-200'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    {/* 상태 dot */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        g.status === 'completed'
                          ? 'bg-green-400'
                          : g.status === 'in_progress'
                            ? 'bg-indigo-500'
                            : 'bg-gray-200'
                      }`}
                    />

                    {/* 이름 */}
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
                          className={`text-sm font-semibold truncate ${
                            g.status === 'completed'
                              ? 'line-through text-gray-400'
                              : g.status === 'planned'
                                ? 'text-gray-400'
                                : 'text-gray-800'
                          }`}
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
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle[g.priority]}`}
                      >
                        {tPriority(g.priority)}
                      </span>
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

                  {/* 프로그레스 바 */}
                  {goalTopics.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 ml-5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            g.status === 'completed'
                              ? 'bg-green-400'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{pct}%</span>
                      <span className="text-xs text-gray-300">
                        {goalTopics.filter((t) => t.completed).length}/
                        {goalTopics.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* 토픽 목록 */}
                {isOpen && goalTopics.length > 0 && (
                  <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1.5">
                    {goalTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleTopic(topic)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            topic.completed
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {topic.completed && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span
                          className={`text-xs flex-1 ${topic.completed ? 'line-through text-gray-300' : 'text-gray-600'}`}
                        >
                          {topic.name}
                        </span>
                        <span className="text-xs text-gray-300">
                          {topic.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 최종 목표 */}
        <div className="flex justify-start pl-4 py-1">
          <div className="w-px h-4 bg-gray-200" />
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-indigo-800">
              리드 아키텍트 🎯
            </p>
            <p className="text-xs text-indigo-500 mt-0.5">최종 목표</p>
          </div>
        </div>
      </div>

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
