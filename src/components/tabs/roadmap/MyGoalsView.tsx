'use client'

import { goalStatusStyle } from '@/lib/statusConfig'
import type { Goal, Topic } from '@/types'
import { ChevronDown, ChevronRight, Pencil, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  activeGoals: Goal[]
  completedGoals: Goal[]
  finalGoal: string
  openGoals: Record<string, boolean>
  showCompleted: boolean
  getTopics: (goalId: string) => Topic[]
  getCategories: (goalId: string) => string[]
  getPct: (goalId: string) => number
  getCatPct: (goalId: string, cat: string) => number
  onToggleGoal: (id: string) => void
  onToggleTopic: (topic: Topic) => void
  onEdit: (goal: Goal) => void
  onAdd: () => void
  onToggleCompleted: () => void
}

export default function MyGoalsView({
  activeGoals, completedGoals, finalGoal, openGoals, showCompleted,
  getTopics, getCategories, getPct, getCatPct,
  onToggleGoal, onToggleTopic, onEdit, onAdd, onToggleCompleted,
}: Props) {
  const t = useTranslations('goals')
  const tStatus = useTranslations('status')
  const router = useRouter()

  const renderGoalCard = (g: Goal, isDone = false) => {
    const goalTopics = getTopics(g.id)
    const categories = getCategories(g.id)
    const pct = getPct(g.id)
    const isOpen = openGoals[g.id] ?? false

    return (
      <div key={g.id} className={`bg-white rounded-xl border overflow-hidden ${
        g.status === 'in_progress' ? 'border-indigo-200'
        : g.status === 'completed' ? 'border-green-200'
        : 'border-gray-200'
      } ${isDone ? 'opacity-70' : ''}`}>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              g.status === 'completed' ? 'bg-green-400'
              : g.status === 'in_progress' ? 'bg-indigo-500'
              : 'bg-gray-200'
            }`} />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`goals/${g.id}`)}>
              <div className="flex items-center gap-1.5">
                {g.is_focus && <Star size={11} className="text-indigo-500 flex-shrink-0" fill="currentColor" />}
                <p className={`text-sm font-semibold truncate ${
                  g.status === 'completed' ? 'line-through text-gray-400'
                  : g.status === 'planned' ? 'text-gray-400'
                  : 'text-gray-800'
                }`}>{g.name}</p>
              </div>
              {g.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{g.description}</p>}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {goalTopics.length > 0 && <span className="text-xs font-semibold text-indigo-500">{pct}%</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${goalStatusStyle[g.status]}`}>{tStatus(g.status)}</span>
              <button onClick={() => onEdit(g)} className="text-gray-400 hover:text-indigo-500 transition-colors"><Pencil size={13} /></button>
              {goalTopics.length > 0 && (
                <button onClick={() => onToggleGoal(g.id)} className="text-gray-400">
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
              )}
            </div>
          </div>
          {goalTopics.length > 0 && (
            <div className="flex items-center gap-2 mt-2 ml-5">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${g.status === 'completed' ? 'bg-green-400' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-300">{goalTopics.filter((t) => t.completed).length}/{goalTopics.length}</span>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-3">
            {categories.map((cat) => {
              const catTopics = goalTopics.filter((t) => t.category === cat)
              const catPct = getCatPct(g.id, cat)
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">{cat}</span>
                    <span className="text-xs text-gray-400">{catPct}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${catPct}%` }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    {catTopics.map((topic) => (
                      <div key={topic.id} className="flex items-center gap-2 cursor-pointer py-0.5" onClick={() => onToggleTopic(topic)}>
                        <span className={`text-xs flex-shrink-0 w-4 ${topic.completed ? 'text-green-500' : 'text-indigo-400'}`}>
                          {topic.completed ? '✓' : '○'}
                        </span>
                        <span className={`text-xs flex-1 ${topic.completed ? 'line-through text-gray-300' : 'text-gray-600'}`}>
                          {topic.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{finalGoal}까지</p>
        <button onClick={onAdd} className="text-indigo-500 hover:text-indigo-700 transition-colors">+</button>
      </div>

      {activeGoals.map((g, idx) => (
        <div key={g.id}>
          {idx > 0 && <div className="flex justify-start pl-4 py-0.5"><div className="w-px h-3 bg-gray-200" /></div>}
          {renderGoalCard(g)}
        </div>
      ))}

      <div className="flex justify-start pl-4 py-0.5"><div className="w-px h-3 bg-gray-200" /></div>
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-indigo-800">{finalGoal} 🎯</p>
          <p className="text-xs text-indigo-500 mt-0.5">{t('finalGoalSub')}</p>
        </div>
      </div>

      {completedGoals.length > 0 && (
        <div className="mt-2">
          <button onClick={onToggleCompleted} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors">
            {showCompleted ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {t('completedGoals')} ({completedGoals.length})
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-2 mt-2">
              {completedGoals.map((g) => renderGoalCard(g, true))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
