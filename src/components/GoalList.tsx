'use client'

import { supabase } from '@/lib/supabase'
import { insertWithUser } from '@/lib/supabase'
import type { Goal } from '@/types'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Modal from './Modal'

interface Props {
  goals: Goal[]
  onRefresh: () => void
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

const priorityLabel: Record<Goal['priority'], string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const priorityStyle: Record<Goal['priority'], string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-500',
}

const emptyForm = {
  name: '',
  description: '',
  status: 'in_progress' as Goal['status'],
  priority: 'medium' as Goal['priority'],
  is_focus: false,
}

export default function GoalList({ goals, onRefresh }: Props) {
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

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
      await insertWithUser('goals', payload)
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

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">진행 중인 목표들</p>
          <button
            onClick={() => open('add')}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="text-sm text-gray-400">목표가 없어요.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {goals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between py-2.5"
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/goals/${g.id}`)}
                >
                  {g.is_focus && (
                    <Star
                      size={13}
                      className="text-indigo-500 flex-shrink-0"
                      fill="currentColor"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {g.name}
                    </p>
                    {g.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {g.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle[g.priority]}`}
                  >
                    {priorityLabel[g.priority]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[g.status]}`}
                  >
                    {statusLabel[g.status]}
                  </span>
                  <button
                    onClick={() => open('edit', g)}
                    className="text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? '목표 추가' : '목표 수정'}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                목표 이름
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: Angular Level 3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">설명</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: 6월 재시험"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
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
                <label className="text-xs text-gray-500 mb-1 block">상태</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
              <button
                onClick={close}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs bg-indigo-500 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
