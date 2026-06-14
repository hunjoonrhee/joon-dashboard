'use client';

import RoadmapTab from '@/components/tabs/RoadmapTab';
import { useGoals, useSessions, useSettings, useTopics } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function RoadmapPage() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useGoals();
  const { data: topics = [] } = useTopics();
  const { data: sessions = [] } = useSessions();
  const { data: settings = {} } = useSettings();

  return (
    <main className="mx-auto px-4 py-4">
      <RoadmapTab
        goals={goals}
        topics={topics}
        sessions={sessions}
        settings={settings}
        onRefresh={() => queryClient.invalidateQueries()}
      />
    </main>
  );
}
