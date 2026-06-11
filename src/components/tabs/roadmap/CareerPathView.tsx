'use client'

import type { CareerData } from '@/types'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  careerData: CareerData | null
  selectedPath: string | null
  selectedStageLevel: number
  studiedTags: Set<string>
  finalGoal: string
  onSelectPath: (pathId: string, stageLevel: number) => void
  onSelectStage: (stageLevel: number) => void
  onBack: () => void
}

export default function CareerPathView({
  careerData,
  selectedPath,
  selectedStageLevel,
  studiedTags,
  finalGoal,
  onSelectPath,
  onSelectStage,
  onBack,
}: Props) {
  const t = useTranslations('roadmap')

  if (!careerData)
    return <p className="text-sm text-gray-400">{t('loading')}</p>

  const currentPath = careerData.paths.find((p) => p.id === selectedPath)
  const currentStage = currentPath?.stages.find(
    (s) => s.level === selectedStageLevel
  )

  if (!selectedPath) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">{t('selectPath')}</p>
        <p className="text-xs text-gray-400 -mt-2">{t('selectPathSub')}</p>
        <div className="flex flex-col gap-3">
          {careerData.paths.map((path) => (
            <button
              key={path.id}
              onClick={() => onSelectPath(path.id, 1)}
              className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xl">{path.icon}</span>
                <p className="text-sm font-bold text-gray-800">{path.title}</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pl-8">
                {path.description}
              </p>
              <div className="flex gap-1 flex-wrap mt-2 pl-8">
                {path.stages.map((stage) => (
                  <span
                    key={stage.id}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                  >
                    {stage.title}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentPath?.icon}</span>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {currentPath?.title}
            </p>
            <p className="text-xs text-gray-400">
              {t('currentStage')}: {currentStage?.title}
            </p>
            {currentPath && (
              <p className="text-xs text-indigo-400 mt-0.5">
                {t('finalStage')}:{' '}
                {currentPath.stages[currentPath.stages.length - 1].title}
                {' → '}
                <span className="text-indigo-600 font-medium">
                  {finalGoal}
                </span>{' '}
                🎯
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={13} /> {t('backToList')}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {currentPath?.stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => onSelectStage(stage.level)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedStageLevel === stage.level
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {stage.title}
          </button>
        ))}
      </div>

      {currentStage && (
        <div className="flex flex-col gap-3">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">
              {currentStage.title}
            </p>
            <p className="text-xs text-indigo-500 leading-relaxed">
              {currentStage.description}
            </p>
          </div>
          {currentStage.skills.map((skill) => {
            const isStudied = skill.tags.some((tag) => studiedTags.has(tag))
            return (
              <div
                key={skill.id}
                className={`bg-white rounded-xl border p-3 ${isStudied ? 'border-green-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-xs ${isStudied ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {isStudied ? '✓' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${isStudied ? 'text-green-700' : 'text-gray-800'}`}
                    >
                      {skill.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {skill.description}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-1.5 py-0.5 rounded-full ${studiedTags.has(tag) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
