'use client'

import { inputCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { Goal, Session, TodayItem, Topic } from '@/types'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  sessions: Session[]
  topics: Topic[]
  goals: Goal[]
  settings: Record<string, string>
  todayItems: TodayItem[]
  onRefresh: () => void
}

export default function HomeTab({
  sessions,
  topics,
  goals,
  settings,
  todayItems,
  onRefresh,
}: Props) {
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [newTag, setNewTag] = useState('')

  const focusGoals = goals.filter((g) => g.is_focus)
  const totalTopics = topics.filter((t) =>
    focusGoals.some((g) => g.id === t.goal_id)
  )
  const completedTopics = totalTopics.filter((t) => t.completed)
  const overallPct =
    totalTopics.length === 0
      ? 0
      : Math.round((completedTopics.length / totalTopics.length) * 100)

  const lastSession = sessions[0]
  const daysSince = lastSession
    ? Math.floor(
        (new Date().getTime() - new Date(lastSession.date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const thisWeek = () => {
    const days = ['월', '화', '수', '목', '금', '토', '일']
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    return days.map((label, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const hasSession = sessions.some((s) => s.date === dateStr)
      const isToday = d.toDateString() === today.toDateString()
      return { label, hasSession, isToday }
    })
  }

  const thisMonth = new Date().getMonth()
  const monthCount = sessions.filter(
    (s) => new Date(s.date).getMonth() === thisMonth
  ).length

  const roadmapGoals = [...goals].sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 }
    return order[a.priority] - order[b.priority]
  })

  const toggleToday = async (item: TodayItem) => {
    await supabase
      .from('today_items')
      .update({ completed: !item.completed })
      .eq('id', item.id)
    onRefresh()
  }

  const addTodayItem = async () => {
    if (!newItem.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('today_items')
      .insert({ name: newItem.trim(), tag: newTag.trim() || null, date: today })
    setNewItem('')
    setNewTag('')
    setAddingItem(false)
    onRefresh()
  }

  const removeToday = async (item: TodayItem) => {
    await supabase.from('today_items').delete().eq('id', item.id)
    onRefresh()
  }

  const week = thisWeek()

  return (
    <div className="flex flex-col gap-4">
      {/* 위치 카드 */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/10" />
        <p className="text-xs font-bold tracking-widest opacity-70 uppercase mb-1">
          나 지금 여기 있어
        </p>
        <p className="text-2xl font-bold tracking-tight mb-0.5">
          {settings.big_goal ?? '리드 아키텍트'}
        </p>
        <p className="text-xs opacity-70 mb-4">
          {settings.big_goal_sub ?? '시니어 → 리드 → 아키텍트'}
        </p>
        <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex gap-6 mt-3">
          <div>
            <div className="text-base font-bold">{overallPct}%</div>
            <div className="text-xs opacity-65">집중 목표 진행도</div>
          </div>
          <div>
            <div className="text-base font-bold">
              {daysSince !== null ? `${daysSince}일` : '-'}
            </div>
            <div className="text-xs opacity-65">마지막 공부</div>
          </div>
          <div>
            <div className="text-base font-bold">{monthCount}회</div>
            <div className="text-xs opacity-65">이번달 세션</div>
          </div>
        </div>
      </div>

      {/* 오늘 할 것 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            오늘 할 것
          </p>
          <button
            onClick={() => setAddingItem(true)}
            className="text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {addingItem && (
          <div className="flex flex-col gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <input
              autoFocus
              type="text"
              className={inputCls}
              placeholder="오늘 할 것..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodayItem()
              }}
            />
            <input
              type="text"
              className={inputCls}
              placeholder="태그 (예: Angular L3)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAddingItem(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
              <button
                onClick={addTodayItem}
                className="text-indigo-500 hover:text-indigo-700"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {todayItems.length === 0 && !addingItem ? (
          <p className="text-sm text-gray-400">
            + 버튼으로 오늘 할 것을 추가해봐.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {todayItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2.5">
                <button
                  onClick={() => toggleToday(item)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${item.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}
                >
                  {item.completed && <Check size={11} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}
                  >
                    {item.name}
                  </p>
                  {item.tag && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.tag}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToday(item)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 이번주 활동 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          이번 주 활동
        </p>
        <div className="flex gap-2 mb-4">
          {week.map(({ label, hasSession, isToday }) => (
            <div
              key={label}
              className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                isToday
                  ? 'bg-indigo-500 text-white'
                  : hasSession
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-500">
              {week.filter((d) => d.hasSession).length}일
            </div>
            <div className="text-xs text-gray-400 mt-0.5">이번주</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">
              {monthCount}회
            </div>
            <div className="text-xs text-gray-400 mt-0.5">이번달</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div
              className={`text-lg font-bold ${daysSince && daysSince > 3 ? 'text-orange-400' : 'text-gray-800'}`}
            >
              {daysSince !== null ? `${daysSince}일` : '-'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">공백</div>
          </div>
        </div>
      </div>

      {/* 로드맵 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          로드맵
        </p>
        <div className="flex flex-col">
          {roadmapGoals.map((g, idx) => (
            <div key={g.id}>
              <div className="flex items-center gap-3 py-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    g.status === 'completed'
                      ? 'bg-green-400'
                      : g.status === 'in_progress'
                        ? 'bg-indigo-500'
                        : 'bg-gray-200'
                  }`}
                />
                <p
                  className={`text-sm font-medium flex-1 ${
                    g.status === 'completed'
                      ? 'line-through text-gray-400'
                      : g.status === 'planned'
                        ? 'text-gray-400'
                        : 'text-gray-800'
                  }`}
                >
                  {g.name}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    g.status === 'completed'
                      ? 'bg-green-50 text-green-600'
                      : g.status === 'in_progress'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {g.status === 'completed'
                    ? '완료'
                    : g.status === 'in_progress'
                      ? '진행 중'
                      : '예정'}
                </span>
              </div>
              {idx < roadmapGoals.length - 1 && (
                <div className="w-px h-3 bg-gray-100 ml-[4.5px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
