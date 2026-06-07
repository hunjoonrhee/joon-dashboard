'use client'

import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import { getTagColor } from '@/lib/tagColor'
import type { Session } from '@/types'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Modal from '../Modal'

interface Props {
  sessions: Session[]
  onRefresh: () => void
}

const emptyForm = {
  date: '',
  title: '',
  duration_minutes: '',
  tags: '',
}

export default function StudyTab({ sessions, onRefresh }: Props) {
  const router = useRouter()
  const t = useTranslations('study')
  const tCommon = useTranslations('common')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Session | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const locale = useLocale()

  const open = (type: 'add' | 'edit', session?: Session) => {
    if (type === 'edit' && session) {
      setSelected(session)
      setForm({
        date: session.date,
        title: session.title,
        duration_minutes: session.duration_minutes?.toString() ?? '',
        tags: session.tags.join(', '),
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

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t('title')}
            </p>
            <button
              onClick={() => open('add')}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">{t('empty')}</p>
          ) : (
            Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider my-2">
                  {month}
                </p>
                <div className="flex flex-col divide-y divide-gray-50">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between py-2.5"
                    >
                      <div
                        className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`sessions/${s.id}`)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 hover:text-indigo-500 transition-colors truncate">
                            {s.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(s.date).toLocaleDateString(
                              locale === 'ko'
                                ? 'ko-KR'
                                : locale === 'de'
                                  ? 'de-DE'
                                  : 'en-US'
                            )}
                            {s.duration_minutes && ` · ${s.duration_minutes}분`}
                          </p>
                          {s.tags.length > 0 && (
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
                          )}
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
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? t('addModal') : t('editModal')}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>{t('date')}</label>
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('name')}</label>
              <input
                type="text"
                className={inputCls}
                placeholder={t('placeholder')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('duration')}</label>
              <input
                type="number"
                className={inputCls}
                placeholder="60"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>{t('tags')}</label>
              <input
                type="text"
                className={inputCls}
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
