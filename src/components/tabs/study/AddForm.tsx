'use client'

import { inputCls, labelCls, saveBtnCls } from '@/lib/styles'
import { StudyForm } from '@/types'

interface Props {
  form: StudyForm
  selectedDate: 'today' | 'yesterday' | 'custom'
  selectedDuration: '30' | '60' | '90' | 'custom'
  saving: boolean
  onFormChange: (form: StudyForm) => void
  onDateChange: (d: 'today' | 'yesterday' | 'custom') => void
  onDurationChange: (d: '30' | '60' | '90' | 'custom') => void
  onSave: () => void
}

export default function AddForm({
  form,
  selectedDate,
  selectedDuration,
  saving,
  onFormChange,
  onDateChange,
  onDurationChange,
  onSave,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        📝 기록 추가
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>오늘 뭐 했어?</label>
          <input
            type="text"
            className={inputCls}
            placeholder="예: async pipe 공부"
            value={form.title}
            onChange={(e) => onFormChange({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>날짜</label>
          <div className="flex gap-2">
            {(['today', 'yesterday', 'custom'] as const).map((d) => (
              <button
                key={d}
                onClick={() => onDateChange(d)}
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
            <input
              type="date"
              className={`${inputCls} mt-2`}
              value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
            />
          )}
        </div>

        <div>
          <label className={labelCls}>시간</label>
          <div className="flex gap-2">
            {(['30', '60', '90', 'custom'] as const).map((d) => (
              <button
                key={d}
                onClick={() => onDurationChange(d)}
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
                onFormChange({ ...form, duration_minutes: e.target.value })
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
            onChange={(e) => onFormChange({ ...form, tags: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>💡 TIL — 오늘 배운 것 (선택)</label>
          <textarea
            className={`${inputCls} min-h-[200px] resize-none`}
            placeholder="짧게라도 괜찮아. 오늘 기억하고 싶은 것..."
            value={form.til}
            onChange={(e) => onFormChange({ ...form, til: e.target.value })}
          />
        </div>

        <button onClick={onSave} disabled={saving} className={saveBtnCls}>
          {saving ? '저장 중...' : '저장 💾'}
        </button>
      </div>
    </div>
  )
}
