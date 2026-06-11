'use client'

import AddSessionModal from '@/components/AddSessionModal'
import { calcMaxStreak, calcStreak } from '@/lib/streak'
import { supabase } from '@/lib/supabase'
import type { CareerData, Goal, Note, ProjectTask, Session, TodayItem, Topic } from '@/types'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import HeroCard from './home/HeroCard'
import NotesPreviewCard from './home/NotesPreviewCard'
import TilPreviewCard from './home/TilPreviewCard'
import TodayCard from './home/TodayCard'
import WeeklyActivityCard from './home/WeeklyActivityCard'

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
  const locale = useLocale()
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [completedItemName, setCompletedItemName] = useState('')
  const [careerData, setCareerData] = useState<CareerData | null>(null)

  // career-paths.json 로드
  useEffect(() => {
    fetch('/career-paths.json')
      .then((r) => r.json())
      .then((d: CareerData) => setCareerData(d))
      .catch(() => {})
  }, [])

  const streak = calcStreak(sessions)
  const maxStreak = calcMaxStreak(sessions)

  const focusGoals = goals.filter((g) => g.is_focus)
  const totalTopics = topics.filter((t) => focusGoals.some((g) => g.id === t.goal_id))
  const completedTopics = totalTopics.filter((t) => t.completed)
  const overallPct =
    totalTopics.length === 0
      ? 0
      : Math.round((completedTopics.length / totalTopics.length) * 100)

  const thisMonth = new Date().getMonth()
  const monthCount = sessions.filter((s) => new Date(s.date).getMonth() === thisMonth).length

  // 갭 분석 계산
  const selectedPath = settings.career_path ?? null
  const selectedStageLevel = parseInt(settings.career_stage ?? '1')
  const studiedTags = new Set(sessions.flatMap((s) => s.tags))

  const { gapPct, careerPathTitle, careerStageTitle } = (() => {
    if (!selectedPath || !careerData) return { gapPct: null, careerPathTitle: null, careerStageTitle: null }

    const currentPath = careerData.paths.find((p) => p.id === selectedPath)
    if (!currentPath) return { gapPct: null, careerPathTitle: null, careerStageTitle: null }

    const currentStage = currentPath.stages.find((s) => s.level === selectedStageLevel)

    const relevantSkills = currentPath.stages
      .filter((s) => s.level <= selectedStageLevel + 1)
      .flatMap((s) => s.skills)

    const totalSkills = relevantSkills.length
    const studiedSkills = relevantSkills.filter((skill) =>
      skill.tags.some((tag) => studiedTags.has(tag))
    ).length

    const pct = totalSkills === 0 ? 0 : Math.round((studiedSkills / totalSkills) * 100)

    return {
      gapPct: pct,
      careerPathTitle: currentPath.title,
      careerStageTitle: currentStage?.title ?? null,
    }
  })()

  const suggestedTopics = totalTopics
    .filter((t) => !t.completed)
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 3)

  const suggestedTasks = projectTasks
    .filter((t) => t.status === 'in_progress')
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 2)

  const getTopicGoalName = (topic: Topic) =>
    focusGoals.find((g) => g.id === topic.goal_id)?.name ?? ''

  // 이번 주 통계
  const weeklyStats = (() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const weeklySessions = sessions.filter((s) => {
      const sd = new Date(s.date)
      return sd >= monday && sd <= today
    })
    return {
      hours: Math.round((weeklySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60) * 10) / 10,
      tilCount: weeklySessions.filter((s) => s.til).length,
    }
  })()

  // 이번 주 요일 배열
  const week = (() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      return {
        label: d
          .toLocaleDateString(
            locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US',
            { weekday: 'short' }
          )
          .slice(0, 2),
        hasSession: sessions.some((s) => s.date === dateStr),
        isToday: d.toDateString() === today.toDateString(),
      }
    })
  })()

  const toggleToday = async (item: TodayItem) => {
    const nowCompleted = !item.completed
    await supabase.from('today_items').update({ completed: nowCompleted }).eq('id', item.id)
    if (nowCompleted && item.source_type === 'topic' && item.source_id) {
      await supabase.from('topics').update({ completed: true }).eq('id', item.source_id)
    }
    if (nowCompleted) {
      setCompletedItemName(item.name)
      setShowSessionModal(true)
    }
    onRefresh()
  }

  const achievements: string[] = []
  if (completedTopics.length > 0)
    achievements.push(`🎉 ${focusGoals[0]?.name ?? ''} ${t('achievementTopics', { count: completedTopics.length })}`)
  if (streak >= 3)
    achievements.push(`🔥 ${t('achievementStreak', { count: streak })}`)
  if (monthCount >= 5)
    achievements.push(`📈 ${t('achievementMonth', { count: monthCount })}`)

  return (
    <div className="flex flex-col gap-4">
      {/* 상단: 히어로 + streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroCard
          settings={settings}
          overallPct={overallPct}
          streak={streak}
          monthCount={monthCount}
          completedTopicsCount={completedTopics.length}
          gapPct={gapPct}
          careerPathTitle={careerPathTitle}
          careerStageTitle={careerStageTitle}
        />
        <WeeklyActivityCard
          streak={streak}
          maxStreak={maxStreak}
          week={week}
          weeklyStats={weeklyStats}
          completedTopicsCount={completedTopics.length}
        />
      </div>

      {/* 중단: 오늘할것 + TIL + 노트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TodayCard
          todayItems={todayItems}
          suggestedTopics={suggestedTopics}
          suggestedTasks={suggestedTasks}
          getTopicGoalName={getTopicGoalName}
          onToggle={toggleToday}
          onRefresh={onRefresh}
        />
        <TilPreviewCard sessions={sessions} onAddStudy={() => setShowSessionModal(true)} />
        <NotesPreviewCard notes={notes} />
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
                color:
                  i === 0 ? '#065f46' : i === 1 ? '#9a3412' : '#312e81',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}

      {showSessionModal && (
        <AddSessionModal
          initialTitle={completedItemName}
          onClose={() => {
            setShowSessionModal(false)
            setCompletedItemName('')
          }}
          onSaved={() => {
            setShowSessionModal(false)
            setCompletedItemName('')
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
