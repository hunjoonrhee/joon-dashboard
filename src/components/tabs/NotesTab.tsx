'use client'

import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  notes: Note[]
  onRefresh: () => void
}

const moods = ['🎯', '🤔', '💪', '😴', '🔥', '😊', '😤']

export default function NotesTab({ notes, onRefresh }: Props) {
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
    setSaving(false)
    onRefresh()
  }

  const remove = async () => {
    if (!selected) return
    await supabase.from('notes').delete().eq('id', selected.id)
    setSelected(null)
    setTitle('')
    setContent('')
    setMood(null)
    setIsNew(false)
    setIsEditing(false)
    onRefresh()
  }

  const dateLabel = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

  const editorPanel = (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2 mb-3">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? null : m)}
              className={`text-lg transition-all ${mood === m ? 'opacity-100 scale-110' : 'opacity-30 hover:opacity-70'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="w-full text-lg font-bold text-gray-800 outline-none placeholder:text-gray-300"
          placeholder="제목을 입력해봐..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        autoFocus
        className="flex-1 w-full p-4 text-sm text-gray-700 outline-none resize-none placeholder:text-gray-300 leading-relaxed min-h-[350px]"
        placeholder="최종 목표를 향한 고민, 오늘 느낀 것, 뭐든 써봐.&#10;&#10;마크다운도 돼 — **볼드**, *이탤릭*, - 리스트"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected && !isNew && (
            <button
              onClick={remove}
              className="text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => {
              setIsEditing(false)
              if (isNew) {
                setIsNew(false)
                setSelected(null)
              }
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            취소
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )

  const viewPanel = selected && (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {selected.mood && <span className="text-lg">{selected.mood}</span>}
            <h2 className="text-lg font-bold text-gray-800">
              {selected.title || '제목 없음'}
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            {dateLabel(selected.updated_at)} 수정
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={remove}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown>{selected.content}</ReactMarkdown>
      </div>
    </div>
  )

  const emptyPanel = (
    <div
      className="bg-white rounded-xl border border-dashed border-gray-200 flex items-center justify-center min-h-[500px] cursor-pointer hover:border-indigo-300 transition-colors"
      onClick={newNote}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">✍️</div>
        <p className="text-sm text-gray-400">
          새 노트를 쓰거나
          <br />
          왼쪽에서 노트를 선택해봐
        </p>
      </div>
    </div>
  )

  const noteList = (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          ✍️ 노트
        </p>
        <button
          onClick={newNote}
          className="text-xs text-indigo-500 font-bold hover:text-indigo-700 transition-colors"
        >
          + 새 노트
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="text-3xl">✍️</div>
          <p className="text-sm font-medium text-gray-600">아직 노트가 없어</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            최종 목표를 향한 고민이나
            <br />
            오늘 느낀 것들을 자유롭게 써봐
          </p>
          <button
            onClick={newNote}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
          >
            첫 노트 쓰기
          </button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => selectNote(note)}
              className={`py-3 cursor-pointer transition-colors rounded-lg px-2 -mx-2 ${
                selected?.id === note.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.mood && <span className="text-sm">{note.mood}</span>}
                <p className="text-sm font-semibold text-gray-800 truncate flex-1">
                  {note.title || '제목 없음'}
                </p>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
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
  )

  const rightPanel = isEditing ? editorPanel : selected ? viewPanel : emptyPanel

  return (
    <>
      {/* 데스크탑: 2컬럼 */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
        {noteList}
        {rightPanel}
      </div>

      {/* 모바일 */}
      <div className="lg:hidden flex flex-col gap-4">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false)
                if (isNew) {
                  setIsNew(false)
                  setSelected(null)
                }
              }}
              className="text-xs text-gray-400 text-left"
            >
              ← 목록으로
            </button>
            {editorPanel}
          </>
        ) : selected ? (
          <>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-gray-400 text-left"
            >
              ← 목록으로
            </button>
            {viewPanel}
          </>
        ) : (
          noteList
        )}
      </div>
    </>
  )
}
