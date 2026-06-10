'use client'

import type { CareerData } from '@/types'

interface Props {
  careerData: CareerData | null
  selectedPath: string | null
  selectedStageLevel: number
  studiedTags: Set<string>
  onGoToCareer: () => void
}

export default function GapAnalysisView({
  careerData, selectedPath, selectedStageLevel, studiedTags, onGoToCareer,
}: Props) {
  if (!selectedPath) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="text-3xl opacity-30">📊</span>
        <p className="text-sm font-semibold text-gray-700">커리어 경로를 먼저 선택해야 해</p>
        <button
          onClick={onGoToCareer}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
        >
          커리어 경로 선택하러 가기
        </button>
      </div>
    )
  }

  if (!careerData) return <p className="text-sm text-gray-400">불러오는 중...</p>

  const currentPath = careerData.paths.find((p) => p.id === selectedPath)
  const currentStage = currentPath?.stages.find((s) => s.level === selectedStageLevel)

  const gapAnalysis = currentPath?.stages
    .filter((s) => s.level <= selectedStageLevel + 1)
    .map((stage) => ({
      stage,
      skills: stage.skills.map((skill) => ({
        skill,
        studied: skill.tags.some((tag) => studiedTags.has(tag)),
        matchedTags: skill.tags.filter((tag) => studiedTags.has(tag)),
      })),
    })) ?? []

  const totalSkills = gapAnalysis.flatMap((s) => s.skills).length
  const studiedSkills = gapAnalysis.flatMap((s) => s.skills).filter((s) => s.studied).length
  const gapPct = totalSkills === 0 ? 0 : Math.round((studiedSkills / totalSkills) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">공부 방향 일치도</p>
          <span className={`text-lg font-bold ${gapPct >= 70 ? 'text-green-500' : gapPct >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
            {gapPct}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${gapPct >= 70 ? 'bg-green-400' : gapPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${gapPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {studiedSkills}/{totalSkills}개 역량 공부 기록 있음 · {currentPath?.title} · {currentStage?.title}
        </p>
      </div>

      {gapAnalysis.map(({ stage, skills }) => {
        const stageDone = skills.filter((s) => s.studied).length
        const stagePct = skills.length === 0 ? 0 : Math.round((stageDone / skills.length) * 100)
        return (
          <div key={stage.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600">{stage.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{stageDone}/{skills.length}</span>
                <span className={`text-xs font-bold ${stagePct >= 70 ? 'text-green-500' : stagePct >= 40 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {stagePct}%
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex flex-col gap-2">
              {skills.map(({ skill, studied, matchedTags }) => (
                <div key={skill.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${studied ? 'bg-green-400' : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${studied ? 'text-green-700' : 'text-gray-600'}`}>{skill.name}</p>
                    {!studied && (
                      <p className="text-xs text-gray-400 mt-0.5">필요 태그: {skill.tags.slice(0, 3).join(', ')}</p>
                    )}
                    {studied && matchedTags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {matchedTags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
