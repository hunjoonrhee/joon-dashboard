'use client'

import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { StudyForm } from '@/types'
import { de, enUS, ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Props {
  onClose: () => void
  onSaved: () => void
}

const emptyForm: StudyForm = {
  title: '',
  date: '',
  duration_minutes: '',
  tags: '',
  til: '',
}

export default function AddSessionModal({ onClose, onSaved }: Props) {
  const locale = useLocale()
  const [form, setForm] = useState<StudyForm>(emptyForm)
  const [selectedDate, setSelectedDate] = useState<
    'today' | 'yesterday' | 'custom'
  >('today')
  const [selectedDuration, setSelectedDuration] = useState<
    '30' | '60' | '90' | 'custom'
  >('60')
  const [saving, setSaving] = useState(false)

  const dateFnsLocale = locale === 'ko' ? ko : locale === 'de' ? de : enUS
  const dateFormat =
    locale === 'ko'
      ? 'yyyy.MM.dd'
      : locale === 'de'
        ? 'dd.MM.yyyy'
        : 'MM/dd/yyyy'

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

  const getDateObj = () => {
    if (selectedDate === 'today') return new Date()
    if (selectedDate === 'yesterday') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d
    }
    return form.date ? new Date(form.date) : new Date()
  }

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('sessions').insert({
      date: getDateValue(),
      title: form.title.trim(),
      duration_minutes: getDurationValue()
        ? parseInt(getDurationValue()!)
        : null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      til: form.til.trim() || null,
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end lg:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-800">📝 공부 기록 추가</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label className={labelCls}>오늘 뭐 했어?</label>
          <input
            autoFocus
            type="text"
            className={inputCls}
            placeholder="예: async pipe 공부"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </div>

        <div>
          <label className={labelCls}>날짜</label>
          <div className="flex gap-2 mb-2">
            {(['today', 'yesterday', 'custom'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  selectedDate === d
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {d === 'today' ? '오늘' : d === 'yesterday' ? '어제' : '직접'}
              </button>
            ))}
          </div>
          {selectedDate === 'custom' && (
            <DatePicker
              selected={getDateObj()}
              onChange={(date: Date | null) => {
                if (date)
                  setForm({ ...form, date: date.toISOString().split('T')[0] })
              }}
              locale={dateFnsLocale}
              dateFormat={dateFormat}
              className={inputCls}
              placeholderText="날짜 선택"
              maxDate={new Date()}
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
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  selectedDuration === d
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
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
          <label className={labelCls}>💡 TIL — 오늘 배운 것 (선택)</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            placeholder="짧게라도 괜찮아. 오늘 기억하고 싶은 것..."
            value={form.til}
            onChange={(e) => setForm({ ...form, til: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className={cancelBtnCls}>
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`${saveBtnCls} flex-1`}
          >
            {saving ? '저장 중...' : '저장 💾'}
          </button>
        </div>
      </div>
    </div>
  )
}
