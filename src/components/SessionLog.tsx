'use client'

import { supabase } from '@/lib/supabase'
import { getTagColor } from '@/lib/tagColor'
import type { Session } from '@/types'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Modal from './Modal'

interface Props {
  sessions: Session[]
  onRefresh: () => void
}

const emptyForm = {
  date: '',
  title: '',
  duration_minutes: '',
  tags: '',
  til: '',
}

export default function SessionLog({ sessions, onRefresh }: Props) {
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Session | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const open = (type: 'add' | 'edit', session?: Session) => {
    if (type === 'edit' && session) {
      setSelected(session)
      setForm({
        date: session.date,
        title: session.title,
        duration_minutes: session.duration_minutes?.toString() ?? '',
        tags: session.tags.join(', '),
        til: session.til ?? '',
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
      date: form.date,
      title: form.title,
      duration_minutes: form.duration_minutes
        ? parseInt(form.duration_minutes)
        : null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      til: form.til || null,
    }
    if (modal === 'add') {
      await supabase.from('sessions').insert(payload)
    } else if (selected) {
      await supabase.from('sessions').update(payload).eq('id', selected.id)
    }
    setSaving(false)
    close()
    onRefresh()
  }

  const remove = async () => {
    if (!selected) return
    await supabase.from('sessions').delete().eq('id', selected.id)
    close()
    onRefresh()
  }

  const recent = sessions.slice(0, 5)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">
            최근 공부/코딩 기록
          </p>
          <button
            onClick={() => open('add')}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">기록이 없어요.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {recent.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between py-2.5"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p
                      className="text-sm text-gray-800 truncate cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={() => router.push(`/sessions/${s.id}`)}
                    >
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(s.date).toLocaleDateString('ko-KR')}
                      {s.duration_minutes && ` · ${s.duration_minutes}분`}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {s.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => open('edit', s)}
                  className="text-gray-400 hover:text-indigo-500 transition-colors ml-2 flex-shrink-0"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? '기록 추가' : '기록 수정'}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">날짜</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">제목</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="오늘 뭐 했어?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                시간 (분)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="60"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Angular, FTL, RxJS"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
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
