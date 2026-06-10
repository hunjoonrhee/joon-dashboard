'use client'

import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import { CareerData } from '@/types'
import { de, enUS, ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Props {
  onClose: () => void
  onSaved: () => void
  initialTitle?: string
}

export default function AddSessionModal({
  onClose,
  onSaved,
  initialTitle,
}: Props) {
  const locale = useLocale()
  const [title, setTitle] = useState(initialTitle ?? '')
  const [til, setTil] = useState('')
  const [selectedDate, setSelectedDate] = useState<
    'today' | 'yesterday' | 'custom'
  >('today')
  const [customDate, setCustomDate] = useState<Date>(new Date())
  const [selectedDuration, setSelectedDuration] = useState<
    '30' | '60' | '90' | 'custom'
  >('60')
  const [customDuration, setCustomDuration] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagPool, setTagPool] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const dateFnsLocale = locale === 'ko' ? ko : locale === 'de' ? de : enUS
  const dateFormat =
    locale === 'ko'
      ? 'yyyy.MM.dd'
      : locale === 'de'
        ? 'dd.MM.yyyy'
        : 'MM/dd/yyyy'

  useEffect(() => {
    fetch('/career-paths.json')
      .then((r) => r.json())
      .then((d: CareerData) => {
        const allTags = [
          ...new Set(
            d.paths.flatMap((p) =>
              p.stages.flatMap((s) => s.skills.flatMap((sk) => sk.tags))
            )
          ),
        ]
        setTagPool(allTags.sort())
      })
      .catch(() => {})
  }, [])

  const getDateValue = () => {
    if (selectedDate === 'today') return new Date().toISOString().split('T')[0]
    if (selectedDate === 'yesterday') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d.toISOString().split('T')[0]
    }
    return customDate.toISOString().split('T')[0]
  }

  const getDurationValue = () => {
    if (selectedDuration !== 'custom') return selectedDuration
    return customDuration
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('sessions').insert({
      date: getDateValue(),
      title: title.trim(),
      duration_minutes: getDurationValue()
        ? parseInt(getDurationValue()!)
        : null,
      tags: selectedTags,
      til: til.trim() || null,
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
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-800">📝 공부 기록 추가</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 완료 항목 뱃지 */}
        {initialTitle && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
            <span className="text-xs text-indigo-500">✓</span>
            <p className="text-xs text-indigo-700 font-medium">
              &ldquo;{initialTitle}&rdquo; 완료 기록
            </p>
          </div>
        )}

        {/* 제목 */}
        <div>
          <label className={labelCls}>오늘 뭐 했어?</label>
          <input
            autoFocus
            type="text"
            className={inputCls}
            placeholder="예: async pipe 공부"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </div>

        {/* 날짜 */}
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
              selected={customDate}
              onChange={(date: Date | null) => {
                if (date) setCustomDate(date)
              }}
              locale={dateFnsLocale}
              dateFormat={dateFormat}
              className={inputCls}
              placeholderText="날짜 선택"
              maxDate={new Date()}
            />
          )}
        </div>

        {/* 시간 */}
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
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            />
          )}
        </div>

        {/* 태그 선택 */}
        <div>
          <label className={labelCls}>태그</label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
            {tagPool.length === 0 ? (
              <p className="text-xs text-gray-400">불러오는 중...</p>
            ) : (
              tagPool.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {tag}
                </button>
              ))
            )}
          </div>
          {selectedTags.length > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              선택됨: {selectedTags.join(', ')}
            </p>
          )}
        </div>

        {/* TIL */}
        <div>
          <label className={labelCls}>💡 TIL — 오늘 배운 것 (선택)</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            placeholder="짧게라도 괜찮아. 오늘 기억하고 싶은 것..."
            value={til}
            onChange={(e) => setTil(e.target.value)}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className={cancelBtnCls}>
            취소
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className={`${saveBtnCls} flex-1`}
          >
            {saving ? '저장 중...' : '저장 💾'}
          </button>
        </div>
      </div>
    </div>
  )
}
