'use client'

import { calcMaxStreak, calcStreak } from '@/lib/streak'
import { inputCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type {
  Goal,
  Note,
  ProjectTask,
  Session,
  TodayItem,
  Topic,
} from '@/types'
import { Check, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  sessions: Session[]
  topics: Topic[]
  goals: Goal[]
  settings: Record<string, string>
  todayItems: TodayItem[]
  projectTasks?: ProjectTask[]
  notes?: Note[]
  onRefresh: () => void
}

export default function HomeTab({
  sessions,
  topics,
  goals,
  settings,
  todayItems,
  projectTasks = [],
  notes = [],
  onRefresh,
}: Props) {
  const t = useTranslations('home')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const router = useRouter()
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [completedItemName, setCompletedItemName] = useState('')

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
    if (!item.completed) {
      // 완료 체크할 때 기록 모달 자동 오픈
      setCompletedItemName(item.name)
      setShowAddModal(true)
    }
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
  const tilSessions = sessions.filter((s) => s.til).slice(0, 2)

  const achievements = []
  if (completedTopics.length > 0)
    achievements.push(
      `🎉 ${focusGoals[0]?.name ?? ''} 토픽 ${completedTopics.length}개 완료했어!`
    )
  if (streak >= 3) achievements.push(`🔥 ${streak}일 연속 공부 중 — 멈추지 마`)
  if (monthCount >= 5) achievements.push(`📈 이번달 ${monthCount}회 공부했어`)

  const getTopicGoalName = (topic: Topic) => {
    const goal = focusGoals.find((g) => g.id === topic.goal_id)
    return goal?.name ?? ''
  }

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
      { month: 'short', day: 'numeric' }
    )

  return (
    <div className="flex flex-col gap-4">
      {/* 상단: 히어로 + streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 히어로 */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-5 text-white relative overflow-hidden">
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
              <div className="text-xs opacity-65">현재 Streak</div>
            </div>
            <div>
              <div className="text-base font-bold">
                {monthCount}
                {t('countUnit')}
              </div>
              <div className="text-xs opacity-65">{t('monthlySession')}</div>
            </div>
            <div>
              <div className="text-base font-bold">
                {completedTopics.length}개
              </div>
              <div className="text-xs opacity-65">완료한 토픽</div>
            </div>
          </div>
        </div>

        {/* streak */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {t('activity')}
          </p>
          {streak > 0 ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{
                background:
                  'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,158,11,0.08))',
                border: '1px solid rgba(249,115,22,0.2)',
              }}
            >
              <span className="text-2xl">🔥</span>
              <div className="flex-1">
                <div className="text-lg font-bold" style={{ color: '#ea580c' }}>
                  {streak}일 연속
                </div>
                <div
                  className="text-xs font-medium"
                  style={{ color: '#9a3412' }}
                >
                  지금 불타고 있어
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">최고 기록</div>
                <div
                  className="text-base font-bold"
                  style={{ color: '#ea580c' }}
                >
                  {maxStreak}일
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-3 bg-gray-50 border border-gray-100">
              <span className="text-xl">💤</span>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  아직 streak이 없어
                </div>
                <div className="text-xs text-gray-400">
                  오늘 공부하면 시작돼!
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-1.5">
            {week.map(({ label, hasSession, isToday }) => (
              <div
                key={label}
                className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium gap-0.5 ${isToday ? 'bg-indigo-500 text-white' : hasSession ? 'text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
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
                  <span style={{ fontSize: '7px' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 중단: 오늘 할 것 + TIL + 노트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              + 추가
            </button>
          </div>

          {(suggestedTopics.length > 0 || suggestedTasks.length > 0) && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">추천</p>
              {suggestedTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg mb-1 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
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
                    <p className="text-xs text-gray-700 truncate font-medium">
                      {topic.name}
                    </p>
                    <p className="text-xs text-gray-400">{topic.category}</p>
                  </div>
                  <span className="text-xs text-indigo-500 font-bold flex-shrink-0">
                    +
                  </span>
                </div>
              ))}
              {suggestedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg mb-1 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all"
                  onClick={() =>
                    addFromSuggestion(task.name, 'Project', 'task', task.id)
                  }
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate font-medium">
                      {task.name}
                    </p>
                    <p className="text-xs text-gray-400">Project</p>
                  </div>
                  <span className="text-xs text-green-500 font-bold flex-shrink-0">
                    +
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
                  ? 'border-t border-gray-100 pt-2 mt-1'
                  : ''
              }
            >
              {(suggestedTopics.length > 0 || suggestedTasks.length > 0) && (
                <p className="text-xs text-gray-400 mb-1.5 font-medium">
                  선택한 것
                </p>
              )}
              <div className="flex flex-col divide-y divide-gray-50">
                {todayItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 py-2">
                    <button
                      onClick={() => toggleToday(item)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${item.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}
                    >
                      {item.completed && <Check size={10} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}
                      >
                        {item.name}
                      </p>
                      {item.tag && (
                        <p className="text-xs text-gray-400">{item.tag}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeToday(item)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={12} />
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

        {/* 최근 TIL */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              💡 최근 TIL
            </p>
            <button
              onClick={() => router.push('study')}
              className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
            >
              전체 보기
            </button>
          </div>
          {tilSessions.length === 0 ? (
            <p className="text-sm text-gray-400">
              아직 TIL이 없어. 공부하고 나서 배운 것을 기록해봐.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {tilSessions.map((s) => (
                <div
                  key={s.id}
                  className="py-2.5 cursor-pointer"
                  onClick={() => router.push(`sessions/${s.id}`)}
                >
                  <p className="text-xs text-gray-400 mb-1">
                    {dateLabel(s.date)}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mb-1 truncate">
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {s.til}
                  </p>
                  {s.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {s.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 노트 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              ✍️ 최근 노트
            </p>
            <button
              onClick={() => router.push('notes')}
              className="text-xs text-indigo-500 font-medium hover:text-indigo-700"
            >
              전체 보기
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400">
              아직 노트가 없어. 고민이나 생각을 자유롭게 적어봐.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="py-2.5 cursor-pointer"
                  onClick={() => router.push('notes')}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {note.mood && <span className="text-sm">{note.mood}</span>}
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {note.title || '제목 없음'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {dateLabel(note.updated_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단: 성취 메시지 */}
      {achievements.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end lg:items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-base font-bold text-gray-800 mb-0.5">
                공부 기록 남길까? 📝
              </p>
              <p className="text-sm text-gray-400">
                &ldquo;{completedItemName}&rdquo; 완료했어!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium hover:bg-gray-50"
              >
                나중에
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  router.push('study')
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600"
              >
                기록 남기기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
