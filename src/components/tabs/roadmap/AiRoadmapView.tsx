'use client'

import GoalModal from '@/components/tabs/roadmap/GoalModal'
import type { AiRoadmap, RoadmapStage } from '@/types'
import { Check, Plus, RefreshCw, Sparkles, Trophy } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  onRefresh?: () => void
  adoptedRoadmap: AiRoadmap | null
  settings: Record<string, string>
  onAdopt: (roadmap: AiRoadmap) => void
}

type State = 'idle' | 'done'

export default function AiRoadmapView({
  adoptedRoadmap,
  settings,
  onAdopt,
  onRefresh,
}: Props) {
  const t = useTranslations('roadmap')
  const locale = useLocale()
  const [state, setState] = useState<State>(adoptedRoadmap ? 'done' : 'idle')
  const [goal, setGoal] = useState(settings.big_goal ?? '')
  const [careerLevel, setCareerLevel] = useState(settings.career_level ?? '')
  const [generated, setGenerated] = useState<AiRoadmap | null>(adoptedRoadmap)
  const [adopted, setAdopted] = useState(!!adoptedRoadmap)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setAdopted(false)
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, careerLevel, locale }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGenerated(data)
      setState('done')
    } catch {
      setError(t('generationFailed'))
      setState('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleAdopt = () => {
    if (!generated) return
    setAdopted(true)
    onAdopt(generated)
  }

  const isAdopted = adopted && generated?.id === adoptedRoadmap?.id

  return (
    <div className="flex flex-col gap-4">
      {/* 입력 영역 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">
          {t('aiRoadmap')}
        </p>
        <div className="flex gap-2 mb-3">
          <div className="flex flex-col gap-1" style={{ flex: 2 }}>
            <label className="text-xs text-gray-400">{t('goalLabel')}</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t('selectPath')}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
            />
          </div>
          <div className="flex flex-col gap-1" style={{ flex: 1 }}>
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

        <div className="flex gap-2">
          {/* 생성 버튼 — idle일 때만 */}
          {state === 'idle' && (
            <button
              onClick={generate}
              disabled={loading || !goal.trim() || !careerLevel.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {t('generateBtn')}
                </>
              )}
            </button>
          )}

          {/* done 상태: 채택 + 재생성 */}
          {state === 'done' && (
            <>
              <button
                onClick={handleAdopt}
                disabled={isAdopted}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isAdopted
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
                }`}
              >
                <Check size={14} />
                {isAdopted ? t('adopted') : t('adoptBtn')}
              </button>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {t('regenerateBtn')}
              </button>
            </>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {isAdopted && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Check size={13} className="text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700">{t('adoptedBanner')}</p>
          </div>
        )}
      </div>

      {/* 생성된 로드맵 */}
      {generated && state === 'done' && (
        <>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-400" />
            {generated.career_level} → {generated.goal} ·{' '}
            {generated.stages.length}
            {t('stagesLabel')}
          </p>
          {generated.stages.map((stage: RoadmapStage) => (
            <StageCard
              key={stage.level}
              stage={stage}
              isLast={stage.level === generated.stages.length}
              onRefresh={onRefresh}
            />
          ))}
        </>
      )}
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
  const locale = useLocale()
  const [open, setOpen] = useState(stage.level === 2)
  const [goalModal, setGoalModal] = useState(false)

  const allTags = stage.skills.flatMap((sk) => sk.tags)

  return (
    <>
      <div
        className={`border rounded-xl overflow-hidden ${isLast ? 'border-indigo-200' : 'border-gray-200'}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            isLast ? 'bg-indigo-50' : 'cursor-pointer bg-white hover:bg-gray-50'
          }`}
          onClick={() => !isLast && setOpen((v) => !v)}
        >
          <div>
            <p
              className={`text-sm font-semibold ${isLast ? 'text-indigo-800' : 'text-gray-700'}`}
            >
              {stage.level}. {t('stageUnit')} · {stage.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
          </div>
          {isLast ? (
            <Trophy size={16} className="text-indigo-400 flex-shrink-0" />
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
              {open ? t('collapseBtn') : t('expandBtn')}
            </span>
          )}
        </div>

        {open && !isLast && stage.skills.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            {stage.skills.map((skill, i) => (
              <div key={i} className="flex items-start gap-2">
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
              onClick={(e) => {
                e.stopPropagation()
                setGoalModal(true)
              }}
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
