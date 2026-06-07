'use client'

import {
  goalStatusLabel,
  goalStatusStyle,
  priorityLabel,
  priorityStyle,
} from '@/lib/statusConfig'
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

export default function GoalsTab({ goals, topics, onRefresh }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [openGoals, setOpenGoals] = useState<Record<string, boolean>>({})

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

  const toggleGoal = (id: string) =>
    setOpenGoals((prev) => ({ ...prev, [id]: !prev[id] }))
  const getTopics = (goalId: string) =>
    topics.filter((t) => t.goal_id === goalId)
  const getPct = (goalId: string) => {
    const t = getTopics(goalId)
    if (t.length === 0) return 0
    return Math.round((t.filter((t) => t.completed).length / t.length) * 100)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              목표
            </p>
            <button
              onClick={() => open('add')}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {goals.length === 0 ? (
            <p className="text-sm text-gray-400">목표가 없어.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {goals.map((g) => {
                const pct = getPct(g.id)
                const goalTopics = getTopics(g.id)
                const isOpen = openGoals[g.id] ?? false
                return (
                  <div
                    key={g.id}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-2 p-3">
                      <button
                        onClick={() => toggleGoal(g.id)}
                        className="text-gray-400 flex-shrink-0"
                      >
                        {isOpen ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/goals/${g.id}`)}
                      >
                        <div className="flex items-center gap-1.5">
                          {g.is_focus && (
                            <Star
                              size={11}
                              className="text-indigo-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                          <p className="text-sm font-medium text-gray-800 truncate">
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
                          {priorityLabel[g.priority]}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${goalStatusStyle[g.status]}`}
                        >
                          {goalStatusLabel[g.status]}
                        </span>
                        <button
                          onClick={() => open('edit', g)}
                          className="text-gray-400 hover:text-indigo-500 transition-colors ml-1"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>

                    {goalTopics.length > 0 && (
                      <div className="px-3 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </div>
                    )}

                    {isOpen && goalTopics.length > 0 && (
                      <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-1.5">
                        {goalTopics.map((t) => (
                          <div key={t.id} className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${t.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}
                            >
                              {t.completed && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <span
                              className={`text-xs ${t.completed ? 'line-through text-gray-300' : 'text-gray-600'}`}
                            >
                              {t.name}
                            </span>
                            <span className="text-xs text-gray-300 ml-auto">
                              {t.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? '목표 추가' : '목표 수정'}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>목표 이름</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: Angular Level 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>설명</label>
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
                <label className={labelCls}>우선순위</label>
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
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={labelCls}>상태</label>
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
                checked={form.is_focus}
                onChange={(e) =>
                  setForm({ ...form, is_focus: e.target.checked })
                }
              />
              <label htmlFor="is_focus" className="text-sm text-gray-600">
                현재 집중 목표로 설정
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
                취소
              </button>
              <button onClick={save} disabled={saving} className={saveBtnCls}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
