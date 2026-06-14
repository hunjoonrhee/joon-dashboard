'use client';

import HomeTab from '@/components/tabs/HomeTab';
import {
  useGoals,
  useNotes,
  useProjectTasks,
  useSessions,
  useSettings,
  useTodayItems,
  useTopics,
} from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useSessions();
  const { data: topics = [] } = useTopics();
  const { data: goals = [] } = useGoals();
  const { data: settings = {} } = useSettings();
  const { data: todayItems = [] } = useTodayItems();
  const { data: projectTasks = [] } = useProjectTasks();
  const { data: notes = [] } = useNotes(3);

  const refresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <main className="px-6 py-6">
      <HomeTab
        sessions={sessions}
        topics={topics}
        goals={goals}
        settings={settings}
        todayItems={todayItems}
        projectTasks={projectTasks}
        notes={notes}
        onRefresh={refresh}
      />
    </main>
  );
}
