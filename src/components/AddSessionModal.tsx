'use client'

import { useToast } from '@/components/Toast'
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { CareerData } from '@/types'
import { de, enUS, ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
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
  const { show } = useToast()
  const t = useTranslations('common')
  const tStudy = useTranslations('study')
  const tToast = useTranslations('toast')

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
  const [tagSearch, setTagSearch] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const getDurationValue = () =>
    selectedDuration !== 'custom' ? selectedDuration : customDuration

  const filteredTags = tagSearch.trim()
    ? tagPool.filter(
        (tag) =>
          tag.toLowerCase().includes(tagSearch.toLowerCase()) &&
          !selectedTags.includes(tag)
      )
    : []

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || selectedTags.includes(trimmed)) return
    setSelectedTags((prev) => [...prev, trimmed])
    setTagSearch('')
    setTagDropdownOpen(false)
  }

  const removeTag = (tag: string) =>
    setSelectedTags((prev) => prev.filter((t) => t !== tag))

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await supabase.from('sessions').insert({
        date: getDateValue(),
        title: title.trim(),
        duration_minutes: getDurationValue()
          ? parseInt(getDurationValue()!)
          : null,
        tags: selectedTags,
        til: til.trim() || null,
      })
      const matchedTags = selectedTags.filter((tag) => tagPool.includes(tag))
      if (matchedTags.length > 0) {
        show(tToast('studySaved'), {
          type: 'success',
          sub: tToast('studySavedGap', {
            tags: matchedTags.slice(0, 2).join(', '),
          }),
        })
      } else {
        show(tToast('studySaved'), { type: 'success' })
      }
      onSaved()
      onClose()
    } catch {
      show(tToast('saveFailed'), { type: 'error' })
    } finally {
      setSaving(false)
    }
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
          <p className="text-base font-bold text-gray-800">
            📝 {tStudy('addModal')}
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {initialTitle && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
            <span className="text-xs text-indigo-500">✓</span>
            <p className="text-xs text-indigo-700 font-medium">
              &ldquo;{initialTitle}&rdquo; {t('completedBadge')}
            </p>
          </div>
        )}

        <div>
          <label className={labelCls}>{tStudy('placeholder')}</label>
          <input
            autoFocus
            type="text"
            className={inputCls}
            placeholder={tStudy('placeholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
            }}
          />
        </div>

        <div>
          <label className={labelCls}>{tStudy('date')}</label>
          <div className="flex gap-2 mb-2">
            {(['today', 'yesterday', 'custom'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${selectedDate === d ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {d === 'today'
                  ? t('today')
                  : d === 'yesterday'
                    ? t('yesterday')
                    : t('custom')}
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
              maxDate={new Date()}
            />
          )}
        </div>

        <div>
          <label className={labelCls}>{tStudy('duration')}</label>
          <div className="flex gap-2">
            {(['30', '60', '90', 'custom'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${selectedDuration === d ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {d === '30'
                  ? t('min30')
                  : d === '60'
                    ? t('min60')
                    : d === '90'
                      ? t('min90')
                      : t('minCustom')}
              </button>
            ))}
          </div>
          {selectedDuration === 'custom' && (
            <input
              type="number"
              className={`${inputCls} mt-2`}
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className={labelCls}>{tStudy('tags')}</label>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTags.map((tag) => {
                const isCustom = !tagPool.includes(tag)
                return (
                  <span
                    key={tag}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isCustom ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-indigo-500 text-white'}`}
                  >
                    {tag}
                    {isCustom && (
                      <span className="text-gray-400 text-xs">*</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-70"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              className={inputCls}
              placeholder={t('tagSearchPlaceholder')}
              value={tagSearch}
              onChange={(e) => {
                setTagSearch(e.target.value)
                setTagDropdownOpen(true)
              }}
              onFocus={() => setTagDropdownOpen(true)}
              onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagSearch.trim()) {
                  e.preventDefault()
                  addTag(tagSearch)
                }
              }}
            />
            {tagDropdownOpen && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {filteredTags.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto">
                    {filteredTags.slice(0, 20).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={() => addTag(tag)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : tagSearch.trim() &&
                  !selectedTags.includes(tagSearch.trim()) ? (
                  <button
                    type="button"
                    onMouseDown={() => addTag(tagSearch)}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400">{t('tagCustomAdd')}: </span>
                    <span className="font-medium text-gray-700">
                      {tagSearch.trim()}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {t('tagGapNote')}
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>💡 TIL</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            value={til}
            onChange={(e) => setTil(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className={cancelBtnCls}>
            {t('cancel')}
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className={`${saveBtnCls} flex-1`}
          >
            {saving ? t('saving') : t('save')} 💾
          </button>
        </div>
      </div>
    </div>
  )
}
