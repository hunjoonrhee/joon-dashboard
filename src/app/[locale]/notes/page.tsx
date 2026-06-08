'use client'

import NotesTab from '@/components/tabs/NotesTab'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { useEffect, useState } from 'react'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data)
      })
  }, [refreshKey])

  return (
    <main className="px-6 py-6">
      <NotesTab notes={notes} onRefresh={() => setRefreshKey((k) => k + 1)} />
    </main>
  )
}
