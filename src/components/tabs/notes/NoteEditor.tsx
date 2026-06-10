'use client'

import type { Note } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const moods = ['🎯', '🤔', '💪', '😴', '🔥', '😊', '😤']

const dateLabel = (d: string) =>
  new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

interface EditorProps {
  title: string
  content: string
  mood: string | null
  saving: boolean
  isNew: boolean
  selectedNote: Note | null
  onTitleChange: (v: string) => void
  onContentChange: (v: string) => void
  onMoodChange: (v: string | null) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

export function NoteEditorPanel({
  title, content, mood, saving, isNew, selectedNote,
  onTitleChange, onContentChange, onMoodChange, onSave, onCancel, onDelete,
}: EditorProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2 mb-3">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => onMoodChange(mood === m ? null : m)}
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
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <textarea
        autoFocus
        className="flex-1 w-full p-4 text-sm text-gray-700 outline-none resize-none placeholder:text-gray-300 leading-relaxed min-h-[350px]"
        placeholder={'최종 목표를 향한 고민, 오늘 느낀 것, 뭐든 써봐.\n\n마크다운도 돼 — **볼드**, *이탤릭*, - 리스트'}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isNew && onDelete && (
            <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            취소
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

interface ViewProps {
  note: Note
  onEdit: () => void
  onDelete: () => void
}

export function NoteViewPanel({ note, onEdit, onDelete }: ViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {note.mood && <span className="text-lg">{note.mood}</span>}
            <h2 className="text-lg font-bold text-gray-800">{note.title || '제목 없음'}</h2>
          </div>
          <p className="text-xs text-gray-400">{dateLabel(note.updated_at)} 수정</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-indigo-500 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export function NoteEmptyPanel({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="bg-white rounded-xl border border-dashed border-gray-200 flex items-center justify-center min-h-[500px] cursor-pointer hover:border-indigo-300 transition-colors"
      onClick={onNew}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">✍️</div>
        <p className="text-sm text-gray-400">새 노트를 쓰거나<br />왼쪽에서 노트를 선택해봐</p>
      </div>
    </div>
  )
}
