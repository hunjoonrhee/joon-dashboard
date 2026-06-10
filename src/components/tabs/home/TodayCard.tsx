'use client'

import { inputCls } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import type { ProjectTask, TodayItem, Topic } from '@/types'
import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  todayItems: TodayItem[]
  suggestedTopics: Topic[]
  suggestedTasks: ProjectTask[]
  getTopicGoalName: (topic: Topic) => string
  onToggle: (item: TodayItem) => void
  onRefresh: () => void
}

export default function TodayCard({
  todayItems,
  suggestedTopics,
  suggestedTasks,
  getTopicGoalName,
  onToggle,
  onRefresh,
}: Props) {
  const t = useTranslations('home')
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [newTag, setNewTag] = useState('')

  const addFromSuggestion = async (
    name: string,
    tag: string,
    sourceType: 'topic' | 'task',
    sourceId: string
  ) => {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('today_items').insert({ name, tag, date: today, source_type: sourceType, source_id: sourceId })
    onRefresh()
  }

  const addTodayItem = async () => {
    if (!newItem.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('today_items').insert({
      name: newItem.trim(),
      tag: newTag.trim() || null,
      date: today,
      source_type: 'manual',
    })
    setNewItem('')
    setNewTag('')
    setAddingItem(false)
    onRefresh()
  }

  const removeToday = async (item: TodayItem) => {
    await supabase.from('today_items').delete().eq('id', item.id)
    onRefresh()
  }

  const hasSuggestions = suggestedTopics.length > 0 || suggestedTasks.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('today')}</p>
        <button onClick={() => setAddingItem(true)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
          + 추가
        </button>
      </div>

      {hasSuggestions && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1.5 font-medium">{t('suggested')}</p>
          {suggestedTopics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg mb-1 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              onClick={() => addFromSuggestion(topic.name, `${getTopicGoalName(topic)} · ${topic.category}`, 'topic', topic.id)}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate font-medium">{topic.name}</p>
                <p className="text-xs text-gray-400">{topic.category}</p>
              </div>
              <span className="text-xs text-indigo-500 font-bold flex-shrink-0">+</span>
            </div>
          ))}
          {suggestedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg mb-1 cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all"
              onClick={() => addFromSuggestion(task.name, 'Project', 'task', task.id)}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate font-medium">{task.name}</p>
                <p className="text-xs text-gray-400">Project</p>
              </div>
              <span className="text-xs text-green-500 font-bold flex-shrink-0">+</span>
            </div>
          ))}
        </div>
      )}

      {addingItem && (
        <div className="flex flex-col gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
          <input
            autoFocus
            type="text"
            className={inputCls}
            placeholder={t('todayInput')}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTodayItem() }}
          />
          <input
            type="text"
            className={inputCls}
            placeholder={t('tagInput')}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAddingItem(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
            <button onClick={addTodayItem} className="text-indigo-500 hover:text-indigo-700">
              <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {todayItems.length > 0 && (
        <div className={hasSuggestions ? 'border-t border-gray-100 pt-2 mt-1' : ''}>
          {hasSuggestions && (
            <p className="text-xs text-gray-400 mb-1.5 font-medium">{t('selected')}</p>
          )}
          <div className="flex flex-col divide-y divide-gray-50">
            {todayItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 py-2">
                <button
                  onClick={() => onToggle(item)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${item.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'}`}
                >
                  {item.completed && <Check size={10} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${item.completed ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                    {item.name}
                  </p>
                  {item.tag && <p className="text-xs text-gray-400">{item.tag}</p>}
                </div>
                <button onClick={() => removeToday(item)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayItems.length === 0 && !addingItem && !hasSuggestions && (
        <p className="text-sm text-gray-400">{t('todayPlaceholder')}</p>
      )}
    </div>
  )
}
