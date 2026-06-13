'use client'

import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import { insertWithUser } from '@/lib/supabase'
import type { Session, StudyForm } from '@/types'
import { Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../Modal'
import SessionList from './study/SessionList'
import TilList from './study/TilList'

interface Props {
  sessions: Session[]
  onRefresh: () => void
}

const emptyForm: StudyForm = {
  title: '',
  date: '',
  duration_minutes: '',
  tags: '',
  til: '',
}

export default function StudyTab({ sessions, onRefresh }: Props) {
  const t = useTranslations('study')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [subTab, setSubTab] = useState<'sessions' | 'til'>('sessions')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Session | null>(null)
  const [form, setForm] = useState<StudyForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<
    'today' | 'yesterday' | 'custom'
  >('today')
  const [selectedDuration, setSelectedDuration] = useState<
    '30' | '60' | '90' | 'custom'
  >('60')

  const getDateValue = () => {
    if (selectedDate === 'today') return new Date().toISOString().split('T')[0]
    if (selectedDate === 'yesterday') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d.toISOString().split('T')[0]
    }
    return form.date
  }

  const getDurationValue = () => {
    if (selectedDuration !== 'custom') return selectedDuration
    return form.duration_minutes
  }

  const openAdd = () => {
    setSelected(null)
    setForm(emptyForm)
    setSelectedDate('today')
    setSelectedDuration('60')
    setModal('add')
  }

  const openEdit = (session: Session) => {
    setSelected(session)
    setForm({
      date: session.date,
      title: session.title,
      duration_minutes: session.duration_minutes?.toString() ?? '',
      tags: session.tags.join(', '),
      til: session.til ?? '',
    })
    setSelectedDate('custom')
    setSelectedDuration(
      session.duration_minutes === 30
        ? '30'
        : session.duration_minutes === 60
          ? '60'
          : session.duration_minutes === 90
            ? '90'
            : 'custom'
    )
    setModal('edit')
  }
  const close = () => {
    setModal(null)
    setSelected(null)
    setForm(emptyForm)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      date: getDateValue(),
      title: form.title,
      duration_minutes: getDurationValue()
        ? parseInt(getDurationValue()!)
        : null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      til: form.til || null,
    }
    if (modal === 'add') {
      await insertWithUser('sessions', payload)
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

  const grouped = sessions.reduce(
    (acc, s) => {
      const month = new Date(s.date).toLocaleDateString(
        locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
        { year: 'numeric', month: 'long' }
      )
      if (!acc[month]) acc[month] = []
      acc[month].push(s)
      return acc
    },
    {} as Record<string, Session[]>
  )

  const tilSessions = sessions.filter((s) => s.til)

  return (
    <>
      {/* 서브탭 */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4">
        <button
          onClick={() => setSubTab('sessions')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${subTab === 'sessions' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
        >
          📝 {t('title')}
        </button>
        <button
          onClick={() => setSubTab('til')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${subTab === 'til' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {t('tilCollection')}
        </button>
      </div>

      {/* 콘텐츠 */}
      {subTab === 'sessions' ? (
        <SessionList
          sessions={sessions}
          grouped={grouped}
          onAdd={openAdd}
          onEdit={openEdit}
        />
      ) : (
        <TilList sessions={tilSessions} />
      )}

      {/* 모바일 모달 */}
      {modal && (
        <Modal
          title={modal === 'add' ? t('addModal') : t('editModal')}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>오늘 뭐 했어?</label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: async pipe 공부"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>날짜</label>
              <div className="flex gap-2">
                {(['today', 'yesterday', 'custom'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${selectedDate === d ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500'}`}
                  >
                    {d === 'today'
                      ? '오늘'
                      : d === 'yesterday'
                        ? '어제'
                        : '직접'}
                  </button>
                ))}
              </div>
              {selectedDate === 'custom' && (
                <input
                  type="date"
                  className={`${inputCls} mt-2`}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              )}
            </div>
            <div>
              <label className={labelCls}>시간</label>
              <div className="flex gap-2">
                {(['30', '60', '90', 'custom'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${selectedDuration === d ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500'}`}
                  >
                    {d === 'custom' ? '직접' : `${d}분`}
                  </button>
                ))}
              </div>
              {selectedDuration === 'custom' && (
                <input
                  type="number"
                  className={`${inputCls} mt-2`}
                  placeholder="분"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: e.target.value })
                  }
                />
              )}
            </div>
            <div>
              <label className={labelCls}>태그</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Angular, FTL, RxJS"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('tilOptional')}</label>
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                placeholder="오늘 기억하고 싶은 것..."
                value={form.til}
                onChange={(e) => setForm({ ...form, til: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-between pt-1">
            {modal === 'edit' ? (
              <button
                onClick={remove}
                className="text-red-400 hover:text-red-600"
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
