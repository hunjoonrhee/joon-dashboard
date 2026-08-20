'use client';

import AddSessionModal from '@/components/AddSessionModal';
import { useUser } from '@/components/UserProvider';
import { supabase } from '@/lib/supabase';
import type { Goal, Note, ProjectTask, Session, TodayItem, Topic } from '@/types';
import { useState } from 'react';
import CoachCard from '../CoachCard';
import HeroCard from './home/HeroCard';
import { useAdoptedRoadmap } from './home/hooks/useAdoptedRoadmap';
import { useHomeStats } from './home/hooks/useHomeStats';
import { useAchievementDetectors } from './home/useAchievementDetectors';
import HomeRoleplayCard from './home/HomeRoleplayCard';
import HomeVocabCard from './home/HomeVocabCard';
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
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [completedItemName, setCompletedItemName] = useState('');

  const user = useUser();
  const { adoptedRoadmap, adoptedRoadmapId } = useAdoptedRoadmap(settings);

  const { sessions, streak, maxStreak, monthCount, overallPct, completedTopics, gapPct, week, weeklyStats } =
    useHomeStats({ adoptedRoadmapId, adoptedRoadmap, topics, goals, allSessions });

  useAchievementDetectors(user?.id, allSessions, goals, adoptedRoadmap);

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

      {adoptedRoadmap?.target_language ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CoachCard sessions={sessions} goals={goals} adoptedRoadmap={adoptedRoadmap} isPro={true} />
          <HomeVocabCard />
          <HomeRoleplayCard isPro={true} defaultLanguage={adoptedRoadmap?.target_language} />
        </div>
      ) : (
        <CoachCard sessions={sessions} goals={goals} adoptedRoadmap={adoptedRoadmap} isPro={true} />
      )}

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
