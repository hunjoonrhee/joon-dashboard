'use client'

import { useUser } from '@/components/UserProvider'
import GoalModal from '@/components/tabs/roadmap/GoalModal'
import { supabase } from '@/lib/supabase'
import type { AiRoadmap, RoadmapStage } from '@/types'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface Props {
  adoptedRoadmap: AiRoadmap | null
  settings: Record<string, string>
  onAdopt: (roadmap: AiRoadmap) => void
  onRefresh?: () => void
}

export default function AiRoadmapView({
  adoptedRoadmap,
  settings,
  onAdopt,
  onRefresh,
}: Props) {
  const t = useTranslations('roadmap')
  const locale = useLocale()
  const user = useUser()
  const [roadmaps, setRoadmaps] = useState<AiRoadmap[]>([])
  const [showForm, setShowForm] = useState(false)
  const [goal, setGoal] = useState(settings.big_goal ?? '')
  const [careerLevel, setCareerLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('ai_roadmaps')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRoadmaps(data as AiRoadmap[])
      })
  }, [])

  const generate = async () => {
    if (!goal.trim() || !careerLevel.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, careerLevel, locale, userId: user?.id }),
      })
      if (!res.ok) throw new Error()
      const data: AiRoadmap = await res.json()
      setRoadmaps((prev) => [data, ...prev])
      setExpandedId(data.id)
      setShowForm(false)
      setCareerLevel('')
    } catch {
      setError(t('generationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleAdopt = async (roadmap: AiRoadmap) => {
    onAdopt(roadmap)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('ai_roadmaps').delete().eq('id', id)
    setRoadmaps((prev) => prev.filter((r) => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const isAdopted = (id: string) => adoptedRoadmap?.id === id

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
          {t('aiRoadmap')}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
        >
          <Plus size={13} />
          {t('newRoadmap')}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-[2]">
              <label className="text-xs text-gray-400">{t('goalLabel')}</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('selectPath')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-400">
                {t('careerLevelLabel')}
              </label>
              <input
                type="text"
                value={careerLevel}
                onChange={(e) => setCareerLevel(e.target.value)}
                placeholder={t('careerLevelPlaceholder')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {t('cancel') ?? '취소'}
            </button>
            <button
              onClick={generate}
              disabled={loading || !goal.trim() || !careerLevel.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  {t('generateBtn')}
                </>
              )}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}

      {roadmaps.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">{t('noRoadmapsYet')}</p>
        </div>
      )}

      {roadmaps.map((roadmap) => {
        const adopted = isAdopted(roadmap.id)
        const expanded = expandedId === roadmap.id
        return (
          <div
            key={roadmap.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              adopted ? 'border-indigo-400 border-2' : 'border-gray-200'
            }`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
                adopted ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setExpandedId(expanded ? null : roadmap.id)}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  adopted ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p
                    className={`text-sm font-semibold truncate ${adopted ? 'text-indigo-800' : 'text-gray-800'}`}
                  >
                    {roadmap.goal}
                  </p>
                  {adopted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium flex-shrink-0">
                      {t('adopted')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {roadmap.career_level} · {roadmap.stages.length}
                  {t('stagesLabel')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!adopted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdopt(roadmap)
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium transition-colors"
                  >
                    {t('adoptBtn')}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(roadmap.id)
                  }}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
                {expanded ? (
                  <ChevronDown size={15} className="text-gray-400" />
                ) : (
                  <ChevronRight size={15} className="text-gray-400" />
                )}
              </div>
            </div>

            {expanded && (
              <div className="border-t border-gray-100">
                {roadmap.stages.map((stage: RoadmapStage) => (
                  <StageCard
                    key={stage.level}
                    stage={stage}
                    isLast={stage.level === roadmap.stages.length}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StageCard({
  stage,
  isLast,
  onRefresh,
}: {
  stage: RoadmapStage
  isLast: boolean
  onRefresh?: () => void
}) {
  const t = useTranslations('roadmap')
  const [open, setOpen] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const allTags = stage.skills.flatMap((sk) => sk.tags)

  return (
    <>
      <div
        className={`border-b border-gray-50 last:border-0 ${isLast ? 'bg-indigo-50' : ''}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2.5 ${!isLast ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => !isLast && setOpen((v) => !v)}
        >
          <div>
            <p
              className={`text-xs font-semibold ${isLast ? 'text-indigo-700' : 'text-gray-700'}`}
            >
              {stage.level}. {t('stageUnit')} · {stage.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
          </div>
          {isLast ? (
            <Trophy size={14} className="text-indigo-400 flex-shrink-0" />
          ) : (
            <span className="text-xs text-gray-400">
              {open ? t('collapseBtn') : t('expandBtn')}
            </span>
          )}
        </div>

        {open && !isLast && (
          <div className="px-4 pb-3 flex flex-col gap-2 border-t border-gray-50">
            {stage.skills.map((skill, i) => (
              <div key={i} className="flex items-start gap-2 pt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0 mt-1.5" />
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    {skill.name}
                  </p>
                  {skill.description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {skill.description}
                    </p>
                  )}
                  {skill.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => setGoalModal(true)}
              className="flex items-center gap-1.5 mt-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <Plus size={12} />
              {t('addToGoals')}
            </button>
          </div>
        )}
      </div>

      {goalModal && (
        <GoalModal
          mode="add"
          preset={{
            name: stage.title,
            description: stage.description,
            tags: allTags,
          }}
          onClose={() => setGoalModal(false)}
          onSaved={() => {
            setGoalModal(false)
            onRefresh?.()
          }}
        />
      )}
    </>
  )
}
