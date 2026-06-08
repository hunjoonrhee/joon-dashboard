'use client'

import { calcMaxStreak, calcStreak } from '@/lib/streak'
import { inputCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { Goal, ProjectTask, Session, TodayItem, Topic } from '@/types'
import { Check, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  sessions: Session[]
  topics: Topic[]
  goals: Goal[]
  settings: Record<string, string>
  todayItems: TodayItem[]
  projectTasks?: ProjectTask[]
  onRefresh: () => void
}

export default function HomeTab({
  sessions,
  topics,
  goals,
  settings,
  todayItems,
  projectTasks = [],
  onRefresh,
}: Props) {
  const t = useTranslations('home')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [newTag, setNewTag] = useState('')

  const streak = calcStreak(sessions)
  const maxStreak = calcMaxStreak(sessions)

  const focusGoals = goals.filter((g) => g.is_focus)
  const totalTopics = topics.filter((t) =>
    focusGoals.some((g) => g.id === t.goal_id)
  )
  const completedTopics = totalTopics.filter((t) => t.completed)
  const overallPct =
    totalTopics.length === 0
      ? 0
      : Math.round((completedTopics.length / totalTopics.length) * 100)

  const thisMonth = new Date().getMonth()
  const monthCount = sessions.filter(
    (s) => new Date(s.date).getMonth() === thisMonth
  ).length

  const suggestedTopics = totalTopics
    .filter((t) => !t.completed)
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 3)

  const suggestedTasks = projectTasks
    .filter((t) => t.status === 'in_progress')
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 2)

  const addFromSuggestion = async (
    name: string,
    tag: string,
    sourceType: 'topic' | 'task',
    sourceId: string
  ) => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('today_items').insert({
      name,
      tag,
      date: today,
      source_type: sourceType,
      source_id: sourceId,
    })
    onRefresh()
  }

  const thisWeek = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const hasSession = sessions.some((s) => s.date === dateStr)
      const isToday = d.toDateString() === today.toDateString()
      const label = d
        .toLocaleDateString(
          locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
          { weekday: 'short' }
        )
        .slice(0, 2)
      return { label, hasSession, isToday }
    })
  }

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
    await supabase.from('today_items').insert({
      name: newItem.trim(),
      tag: newTag.trim() || null,
      date: today,
      source_type: 'manual',
    })
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

  const achievements = []
  if (completedTopics.length > 0) {
    achievements.push(
      `🎉 ${focusGoals[0]?.name ?? ''} 토픽 ${completedTopics.length}개 완료했어!`
    )
  }
  if (streak >= 3) {
    achievements.push(`🔥 ${streak}일 연속 공부 중 — 멈추지 마`)
  }
  if (monthCount >= 5) {
    achievements.push(`📈 이번달 ${monthCount}회 공부했어`)
  }

  const getTopicGoalName = (topic: Topic) => {
    const goal = focusGoals.find((g) => g.id === topic.goal_id)
    return goal?.name ?? ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 히어로 */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/10" />
        <p className="text-xs font-bold tracking-widest opacity-70 uppercase mb-1">
          {t('location')}
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
            <div className="text-xs opacity-65">{t('progressLabel')}</div>
          </div>
          <div>
            <div className="text-base font-bold">
              {streak > 0 ? `${streak}일 🔥` : '-'}
            </div>
            <div className="text-xs opacity-65">Streak</div>
          </div>
          <div>
            <div className="text-base font-bold">
              {monthCount}
              {t('countUnit')}
            </div>
            <div className="text-xs opacity-65">{t('monthlySession')}</div>
          </div>
        </div>
      </div>

      {/* 성취 메시지 */}
      {achievements.length > 0 && (
        <div className="flex flex-col gap-2">
          {achievements.map((msg, i) => (
            <div
              key={i}
              className="text-sm font-medium px-3 py-2.5 rounded-xl border"
              style={{
                background:
                  i === 0
                    ? 'rgba(16,185,129,0.08)'
                    : i === 1
                      ? 'rgba(249,115,22,0.08)'
                      : 'rgba(99,102,241,0.08)',
                borderColor:
                  i === 0
                    ? 'rgba(16,185,129,0.2)'
                    : i === 1
                      ? 'rgba(249,115,22,0.2)'
                      : 'rgba(99,102,241,0.2)',
                color: i === 0 ? '#065f46' : i === 1 ? '#9a3412' : '#312e81',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* streak + 이번주 활동 통합 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {t('activity')}
          </p>
        </div>

        {streak > 0 ? (
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{
              background:
                'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.08))',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <span className="text-3xl">🔥</span>
            <div className="flex-1">
              <div className="text-xl font-bold" style={{ color: '#ea580c' }}>
                {streak}일 연속
              </div>
              <div className="text-xs font-medium" style={{ color: '#9a3412' }}>
                지금 불타고 있어
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">최고 기록</div>
              <div className="text-lg font-bold" style={{ color: '#ea580c' }}>
                {maxStreak}일
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4 bg-gray-50 border border-gray-100">
            <span className="text-2xl">💤</span>
            <div>
              <div className="text-sm font-medium text-gray-500">
                아직 streak이 없어
              </div>
              <div className="text-xs text-gray-400">오늘 공부하면 시작돼!</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          {week.map(({ label, hasSession, isToday }) => (
            <div
              key={label}
              className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium gap-0.5 ${
                isToday
                  ? 'bg-indigo-500 text-white'
                  : hasSession
                    ? 'text-orange-700 border border-orange-200'
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}
              style={
                hasSession && !isToday
                  ? {
                      background:
                        'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(245,158,11,0.08))',
                    }
                  : {}
              }
            >
              <span>{label}</span>
              {hasSession && !isToday && (
                <span style={{ fontSize: '8px' }}>✓</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-500">
              {week.filter((d) => d.hasSession).length}
              {t('dayUnit')}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{t('thisWeek')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">
              {monthCount}
              {t('countUnit')}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{t('thisMonth')}</div>
          </div>
        </div>
      </div>

      {/* 오늘 할 것 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {t('today')}
          </p>
          <button
            onClick={() => setAddingItem(true)}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            + 직접 추가
          </button>
        </div>

        {(suggestedTopics.length > 0 || suggestedTasks.length > 0) && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2 font-medium">
              추천 — 집중 목표에서
            </p>
            {suggestedTopics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg mb-1.5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                onClick={() =>
                  addFromSuggestion(
                    topic.name,
                    `${getTopicGoalName(topic)} · ${topic.category}`,
                    'topic',
                    topic.id
                  )
                }
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{topic.name}</p>
                  <p className="text-xs text-gray-400">
                    {getTopicGoalName(topic)} · {topic.category}
                  </p>
                </div>
                <span className="text-xs text-indigo-500 font-medium flex-shrink-0">
                  + 추가
                </span>
              </div>
            ))}
            {suggestedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg mb-1.5 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all"
                onClick={() =>
                  addFromSuggestion(task.name, 'Project', 'task', task.id)
                }
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{task.name}</p>
                  <p className="text-xs text-gray-400">Project</p>
                </div>
                <span className="text-xs text-green-500 font-medium flex-shrink-0">
                  + 추가
                </span>
              </div>
            ))}
          </div>
        )}

        {addingItem && (
          <div className="flex flex-col gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <input
              autoFocus
              type="text"
              className={inputCls}
              placeholder={t('todayInput')}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodayItem()
              }}
            />
            <input
              type="text"
              className={inputCls}
              placeholder={t('tagInput')}
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

        {todayItems.length > 0 && (
          <div
            className={
              suggestedTopics.length > 0 || suggestedTasks.length > 0
                ? 'border-t border-gray-100 pt-3'
                : ''
            }
          >
            {(suggestedTopics.length > 0 || suggestedTasks.length > 0) && (
              <p className="text-xs text-gray-400 mb-2 font-medium">
                오늘 선택한 것
              </p>
            )}
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
          </div>
        )}

        {todayItems.length === 0 &&
          !addingItem &&
          suggestedTopics.length === 0 &&
          suggestedTasks.length === 0 && (
            <p className="text-sm text-gray-400">{t('todayPlaceholder')}</p>
          )}
      </div>

      {/* 로드맵 미니 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          {t('roadmap')}
        </p>
        <div className="flex flex-col">
          {[...goals]
            .sort((a, b) => {
              const order = { urgent: 0, high: 1, medium: 2, low: 3 }
              return order[a.priority] - order[b.priority]
            })
            .map((g, idx, arr) => (
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
                    {tStatus(g.status)}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-px h-3 bg-gray-100 ml-[4.5px]" />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
