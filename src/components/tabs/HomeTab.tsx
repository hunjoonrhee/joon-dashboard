'use client';

import AddSessionModal from '@/components/AddSessionModal';
import { supabase } from '@/lib/supabase';
import type { Goal, Note, ProjectTask, Session, TodayItem, Topic } from '@/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import CoachCard from '../CoachCard';
import HeroCard from './home/HeroCard';
import { useAdoptedRoadmap } from './home/hooks/useAdoptedRoadmap';
import { useHomeStats } from './home/hooks/useHomeStats';
import NotesPreviewCard from './home/NotesPreviewCard';
import TilPreviewCard from './home/TilPreviewCard';
import TodayCard from './home/TodayCard';
import WeeklyActivityCard from './home/WeeklyActivityCard';

interface Props {
  sessions: Session[];
  topics: Topic[];
  goals: Goal[];
  settings: Record<string, string>;
  todayItems: TodayItem[];
  projectTasks?: ProjectTask[];
  notes?: Note[];
  onRefresh: () => void;
}

export default function HomeTab({
  sessions: allSessions,
  topics,
  goals,
  settings,
  todayItems,
  projectTasks = [],
  notes = [],
  onRefresh,
}: Props) {
  const t = useTranslations('home');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [completedItemName, setCompletedItemName] = useState('');

  const { adoptedRoadmap, adoptedRoadmapId } = useAdoptedRoadmap(settings);

  const { sessions, streak, maxStreak, monthCount, overallPct, completedTopics, gapPct, week, weeklyStats } =
    useHomeStats({ adoptedRoadmapId, adoptedRoadmap, topics, goals, allSessions });

  const focusGoals = goals.filter((g) => g.is_focus);
  const totalTopics = topics.filter((t) => focusGoals.some((g) => g.id === t.goal_id));

  const suggestedTopics = totalTopics
    .filter((t) => !t.completed)
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 3);

  const suggestedTasks = projectTasks
    .filter((t) => t.status === 'in_progress')
    .filter((t) => !todayItems.some((ti) => ti.source_id === t.id))
    .slice(0, 2);

  const getTopicGoalName = (topic: Topic) => focusGoals.find((g) => g.id === topic.goal_id)?.name ?? '';

  const toggleToday = async (item: TodayItem) => {
    const nowCompleted = !item.completed;
    await supabase.from('today_items').update({ completed: nowCompleted }).eq('id', item.id);
    if (nowCompleted && item.source_type === 'topic' && item.source_id) {
      await supabase.from('topics').update({ completed: true }).eq('id', item.source_id);
    }
    if (nowCompleted) {
      setCompletedItemName(item.name);
      setShowSessionModal(true);
    }
    onRefresh();
  };

  const achievements: string[] = [];
  if (completedTopics.length > 0)
    achievements.push(`🎉 ${focusGoals[0]?.name ?? ''} ${t('achievementTopics', { count: completedTopics.length })}`);
  if (streak >= 3) achievements.push(`🔥 ${t('achievementStreak', { count: streak })}`);
  if (monthCount >= 5) achievements.push(`📈 ${t('achievementMonth', { count: monthCount })}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroCard
          settings={settings}
          overallPct={overallPct}
          streak={streak}
          monthCount={monthCount}
          completedTopicsCount={completedTopics.length}
          adoptedRoadmap={adoptedRoadmap}
          gapPct={gapPct}
        />
        <WeeklyActivityCard
          streak={streak}
          maxStreak={maxStreak}
          week={week}
          weeklyStats={weeklyStats}
          completedTopicsCount={completedTopics.length}
        />
      </div>

      <CoachCard sessions={sessions} goals={goals} adoptedRoadmap={adoptedRoadmap} isPro={true} />

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

      {achievements.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {achievements.map((msg, i) => (
            <div
              key={i}
              className="text-sm font-medium px-3 py-2.5 rounded-xl border"
              style={{
                background:
                  i === 0 ? 'rgba(16,185,129,0.08)' : i === 1 ? 'rgba(249,115,22,0.08)' : 'rgba(99,102,241,0.08)',
                borderColor:
                  i === 0 ? 'rgba(16,185,129,0.2)' : i === 1 ? 'rgba(249,115,22,0.2)' : 'rgba(99,102,241,0.2)',
                color: i === 0 ? '#065f46' : i === 1 ? '#9a3412' : '#312e81',
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
            setShowSessionModal(false);
            setCompletedItemName('');
          }}
          onSaved={() => {
            setShowSessionModal(false);
            setCompletedItemName('');
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
