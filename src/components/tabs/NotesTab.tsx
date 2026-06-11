'use client'

import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  NoteEditorPanel,
  NoteEmptyPanel,
  NoteViewPanel,
} from './notes/NoteEditor'
import NoteList from './notes/NoteList'

interface Props {
  notes: Note[]
  onRefresh: () => void
}

export default function NotesTab({ notes, onRefresh }: Props) {
  const { show } = useToast()
  const tToast = useTranslations('toast')
  const tNotes = useTranslations('notes')

  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const newNote = () => {
    setSelected(null)
    setTitle('')
    setContent('')
    setMood(null)
    setIsNew(true)
    setIsEditing(true)
  }

  const selectNote = (note: Note) => {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
    setMood(note.mood)
    setIsNew(false)
    setIsEditing(false)
  }

  const save = async () => {
    if (!title.trim() && !content.trim()) return
    setSaving(true)
    const payload = {
      title: title.trim(),
      content: content.trim(),
      mood,
      updated_at: new Date().toISOString(),
    }
    try {
      if (isNew || !selected) {
        const { data } = await supabase
          .from('notes')
          .insert(payload)
          .select()
          .single()
        if (data) {
          setSelected(data)
          setIsNew(false)
          setIsEditing(false)
        }
      } else {
        await supabase.from('notes').update(payload).eq('id', selected.id)
        setSelected({ ...selected, ...payload })
        setIsEditing(false)
      }
      show(tToast('noteSaved'), { type: 'success' })
      onRefresh()
    } catch {
      show(tToast('saveFailed'), { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!selected) return
    try {
      await supabase.from('notes').delete().eq('id', selected.id)
      show(tToast('noteDeleted'), { type: 'info' })
      setSelected(null)
      setTitle('')
      setContent('')
      setMood(null)
      setIsNew(false)
      setIsEditing(false)
      onRefresh()
    } catch {
      show(tToast('deleteFailed'), { type: 'error' })
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    if (isNew) {
      setIsNew(false)
      setSelected(null)
    }
  }

  const rightPanel = isEditing ? (
    <NoteEditorPanel
      title={title}
      content={content}
      mood={mood}
      saving={saving}
      isNew={isNew}
      selectedNote={selected}
      onTitleChange={setTitle}
      onContentChange={setContent}
      onMoodChange={setMood}
      onSave={save}
      onCancel={cancelEdit}
      onDelete={!isNew ? remove : undefined}
    />
  ) : selected ? (
    <NoteViewPanel
      note={selected}
      onEdit={() => setIsEditing(true)}
      onDelete={remove}
    />
  ) : (
    <NoteEmptyPanel onNew={newNote} />
  )

  return (
    <>
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        <NoteList
          notes={notes}
          selectedId={selected?.id ?? null}
          onSelect={selectNote}
          onNew={newNote}
        />
        {rightPanel}
      </div>
      <div className="lg:hidden flex flex-col gap-4">
        {isEditing ? (
          <>
            <button
              onClick={cancelEdit}
              className="text-xs text-gray-400 text-left"
            >
              {tNotes('backToList')}
            </button>
            <NoteEditorPanel
              title={title}
              content={content}
              mood={mood}
              saving={saving}
              isNew={isNew}
              selectedNote={selected}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onMoodChange={setMood}
              onSave={save}
              onCancel={cancelEdit}
              onDelete={!isNew ? remove : undefined}
            />
          </>
        ) : selected ? (
          <>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-gray-400 text-left"
            >
              {tNotes('backToList')}
            </button>
            <NoteViewPanel
              note={selected}
              onEdit={() => setIsEditing(true)}
              onDelete={remove}
            />
          </>
        ) : (
          <NoteList
            notes={notes}
            selectedId={null}
            onSelect={selectNote}
            onNew={newNote}
          />
        )}
      </div>
    </>
  )
}
