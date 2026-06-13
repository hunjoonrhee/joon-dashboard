'use client'

import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

interface Props {
  onComplete: () => void
}

const steps = [
  {
    id: 1,
    icon: '🎯',
    title: '안녕, 나는 네 성장 파트너야',
    sub: '매일 뭘 공부했는지 기록하고\n어디까지 왔는지 함께 볼게',
    btn: '시작할게 →',
  },
  {
    id: 2,
    icon: '👋',
    title: '이름이 뭐야?',
    sub: '앱이 너를 어떻게 부를지 알려줘',
    btn: '다음 →',
    input: { key: 'name', placeholder: '예: Joon' },
  },
  {
    id: 3,
    icon: '🏆',
    title: '지금 가장 이루고 싶은 게 뭐야?',
    sub: '완벽하지 않아도 돼\n지금 머릿속에 있는 거 그대로 써봐',
    btn: '다음 →',
    input: { key: 'big_goal', placeholder: '예: 리드 아키텍트' },
  },
  {
    id: 4,
    icon: '🛤',
    title: '거기까지 가는 길을 한 줄로 표현하면?',
    sub: '지금 단계에서 최종 목표까지\n어떤 여정인지 써봐',
    btn: '다음 →',
    input: { key: 'big_goal_sub', placeholder: '예: 시니어 → 리드 → 아키텍트' },
  },
  {
    id: 5,
    icon: '✅',
    title: '그럼 오늘 뭐 할 거야?',
    sub: '작은 거 하나면 충분해\n지금 당장 할 수 있는 거',
    btn: '시작하자! 🚀',
    input: { key: 'today', placeholder: '예: Angular 이론 30분 공부' },
    skip: true,
  },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const current = steps[step - 1]
  const total = steps.length

  const next = async () => {
    if (step < total) {
      setStep(step + 1)
      return
    }
    await finish()
  }

  const finish = async () => {
    setSaving(true)
    const userId = await getCurrentUserId()

    const upserts = [
      { key: 'onboarding_completed', value: 'true', user_id: userId },
      { key: 'name', value: values.name || 'Joon', user_id: userId },
      { key: 'big_goal', value: values.big_goal || '리드 아키텍트', user_id: userId },
      {
        key: 'big_goal_sub',
        value: values.big_goal_sub || '시니어 → 리드 → 아키텍트',
        user_id: userId,
      },
    ]

    for (const item of upserts) {
      await supabase.from('settings').upsert(item, { onConflict: 'key' })
    }

    if (values.today?.trim()) {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('today_items').insert({
        name: values.today.trim(),
        date: today,
        source_type: 'manual',
        user_id: userId,
      })
    }

    setSaving(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="text-6xl">{current.icon}</div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-snug">
            {current.title}
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
            {current.sub}
          </p>
        </div>

        {current.input && (
          <input
            autoFocus
            type="text"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-center font-medium outline-none focus:border-indigo-500 transition-colors bg-white"
            placeholder={current.input.placeholder}
            value={values[current.input.key] ?? ''}
            onChange={(e) =>
              setValues({ ...values, [current.input!.key]: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') next()
            }}
          />
        )}

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={next}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-60"
          >
            {saving ? '저장 중...' : current.btn}
          </button>
          {current.skip && (
            <button
              onClick={finish}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              나중에 추가할게
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                s.id === step
                  ? 'w-5 bg-indigo-500'
                  : s.id < step
                    ? 'w-2 bg-indigo-300'
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
