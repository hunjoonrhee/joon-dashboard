'use client'

import type { AiRoadmap } from '@/types'
import { useTranslations } from 'next-intl'

interface Props {
  adoptedRoadmap: AiRoadmap | null
  studiedTags: Set<string>
  onGoToAi: () => void
}

export default function GapAnalysisView({
  adoptedRoadmap,
  studiedTags,
  onGoToAi,
}: Props) {
  const t = useTranslations('roadmap')

  if (!adoptedRoadmap) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="text-3xl opacity-30">📊</span>
        <p className="text-sm font-semibold text-gray-700">
          {t('noAdoptedRoadmap')}
        </p>
        <button
          onClick={onGoToAi}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
        >
          {t('generateFirst')}
        </button>
      </div>
    )
  }

  const allSkills = adoptedRoadmap.stages.flatMap((s) => s.skills)
  const totalSkills = allSkills.length
  const studiedSkills = allSkills.filter((sk) =>
    sk.tags.some((tag) => studiedTags.has(tag))
  ).length
  const gapPct =
    totalSkills === 0 ? 0 : Math.round((studiedSkills / totalSkills) * 100)

  return (
    <div className="flex flex-col gap-4">
      {/* 전체 일치도 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">{t('gapTitle')}</p>
          <span
            className={`text-lg font-bold ${
              gapPct >= 70
                ? 'text-green-500'
                : gapPct >= 40
                  ? 'text-amber-500'
                  : 'text-red-400'
            }`}
          >
            {gapPct}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${
              gapPct >= 70
                ? 'bg-green-400'
                : gapPct >= 40
                  ? 'bg-amber-400'
                  : 'bg-red-400'
            }`}
            style={{ width: `${gapPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {t('gapSummary', { studied: studiedSkills, total: totalSkills })}
          {' · '}
          {adoptedRoadmap.goal} · {adoptedRoadmap.career_level}
        </p>
      </div>

      {/* 단계별 갭 */}
      {adoptedRoadmap.stages.map((stage) => {
        const stageDone = stage.skills.filter((sk) =>
          sk.tags.some((tag) => studiedTags.has(tag))
        ).length
        const stagePct =
          stage.skills.length === 0
            ? 0
            : Math.round((stageDone / stage.skills.length) * 100)

        return (
          <div
            key={stage.level}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600">{stage.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {stageDone}/{stage.skills.length}
                </span>
                <span
                  className={`text-xs font-bold ${
                    stagePct >= 70
                      ? 'text-green-500'
                      : stagePct >= 40
                        ? 'text-amber-500'
                        : 'text-gray-400'
                  }`}
                >
                  {stagePct}%
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex flex-col gap-2">
              {stage.skills.map((skill, i) => {
                const studied = skill.tags.some((tag) => studiedTags.has(tag))
                const matchedTags = skill.tags.filter((tag) =>
                  studiedTags.has(tag)
                )
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${
                        studied ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${studied ? 'text-green-700' : 'text-gray-600'}`}
                      >
                        {skill.name}
                      </p>
                      {!studied && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('requiredTags')}:{' '}
                          {skill.tags.slice(0, 3).join(', ')}
                        </p>
                      )}
                      {studied && matchedTags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-400">
        공부기록 태그만 반영돼. 프로젝트 진행 여부는 갭 분석에 포함 안 됨.
      </div>
    </div>
  )
}
