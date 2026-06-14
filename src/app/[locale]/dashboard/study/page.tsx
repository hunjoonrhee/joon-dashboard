'use client';

import StudyTab from '@/components/tabs/StudyTab';
import { useSessions } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function StudyPage() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useSessions();

  return (
    <main className="mx-auto px-4 py-4">
      <StudyTab
        sessions={sessions}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
        }
      />
    </main>
  );
}
