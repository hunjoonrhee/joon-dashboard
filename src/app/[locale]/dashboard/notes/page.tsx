'use client';

import NotesTab from '@/components/tabs/NotesTab';
import { useNotes } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function NotesPage() {
  const queryClient = useQueryClient();
  const { data: notes = [] } = useNotes();

  return (
    <main className="px-6 py-6">
      <NotesTab notes={notes} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['notes'] })} />
    </main>
  );
}
