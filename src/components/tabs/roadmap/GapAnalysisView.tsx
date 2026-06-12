'use client'

import { supabase } from '@/lib/supabase'
import type { AiRoadmap } from '@/types'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface Props {
  adoptedRoadmap: AiRoadmap | null
  studiedTags: Set<string>
  onGoToAi: () => void
}

type TrustSource = 'cert' | 'practical' | 'study' | 'none'

interface SkillWithSource {
  name: string
  tags: string[]
  source: TrustSource
  matchedTags: string[]
}

export default function GapAnalysisView({
  adoptedRoadmap,
  studiedTags,
  onGoToAi,
}: Props) {
  const t = useTranslations('roadmap')
  const [certTags, setCertTags] = useState<Set<string>>(new Set())
  const [practicalTags, setPracticalTags] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      const [certsRes, projectSkillsRes] = await Promise.all([
        supabase.from('certifications').select('tags'),
        supabase.from('project_skills').select('tags'),
      ])
      if (certsRes.data) {
        const tags = new Set<string>(
          (certsRes.data as { tags: string[] }[]).flatMap((c) => c.tags)
        )
        setCertTags(tags)
      }
      if (projectSkillsRes.data) {
        const tags = new Set<string>(
          (projectSkillsRes.data as { tags: string[] }[]).flatMap(
            (ps) => ps.tags
          )
        )
        setPracticalTags(tags)
      }
    }
    load()
  }, [])

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

  const getSource = (
    tags: string[]
  ): { source: TrustSource; matchedTags: string[] } => {
    const certMatched = tags.filter((tag) => certTags.has(tag))
    if (certMatched.length > 0)
      return { source: 'cert', matchedTags: certMatched }
    const practicalMatched = tags.filter((tag) => practicalTags.has(tag))
    if (practicalMatched.length > 0)
      return { source: 'practical', matchedTags: practicalMatched }
    const studyMatched = tags.filter((tag) => studiedTags.has(tag))
    if (studyMatched.length > 0)
      return { source: 'study', matchedTags: studyMatched }
    return { source: 'none', matchedTags: [] }
  }

  const getWeight = (source: TrustSource) => {
    if (source === 'cert') return 1.0
    if (source === 'practical') return 1.0
    if (source === 'study') return 0.6
    return 0
  }

  const allSkills = adoptedRoadmap.stages.flatMap((s) =>
    s.skills.map((sk): SkillWithSource => {
      const { source, matchedTags } = getSource(sk.tags)
      return { name: sk.name, tags: sk.tags, source, matchedTags }
    })
  )

  const totalWeight = allSkills.reduce(
    (sum, sk) => sum + getWeight(sk.source),
    0
  )
  const maxWeight = allSkills.length
  const gapPct =
    maxWeight === 0 ? 0 : Math.round((totalWeight / maxWeight) * 100)

  const sourceLabel = (source: TrustSource) => {
    if (source === 'cert')
      return {
        label: t('sourceCert'),
        color: 'bg-green-50 text-green-600 border-green-100',
      }
    if (source === 'practical')
      return {
        label: t('sourcePractical'),
        color: 'bg-amber-50 text-amber-600 border-amber-100',
      }
    if (source === 'study')
      return {
        label: t('sourceStudy'),
        color: 'bg-indigo-50 text-indigo-500 border-indigo-100',
      }
    return {
      label: t('sourceNone'),
      color: 'bg-gray-50 text-gray-400 border-gray-100',
    }
  }

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
          {t('gapSummary', {
            studied: Math.round(totalWeight * 10) / 10,
            total: maxWeight,
          })}
          {' · '}
          {adoptedRoadmap.goal}
        </p>
        {/* 신뢰도 범례 */}
        <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-gray-100">
          {[
            { source: 'cert' as TrustSource, icon: '🏆' },
            { source: 'practical' as TrustSource, icon: '⚡' },
            { source: 'study' as TrustSource, icon: '📖' },
            { source: 'none' as TrustSource, icon: '○' },
          ].map(({ source, icon }) => {
            const { label, color } = sourceLabel(source)
            return (
              <span
                key={source}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${color}`}
              >
                <span>{icon}</span>
                {label}
              </span>
            )
          })}
        </div>
      </div>

      {/* 단계별 갭 */}
      {adoptedRoadmap.stages.map((stage) => {
        const stageSkills = stage.skills.map((sk): SkillWithSource => {
          const { source, matchedTags } = getSource(sk.tags)
          return { name: sk.name, tags: sk.tags, source, matchedTags }
        })
        const stageWeight = stageSkills.reduce(
          (sum, sk) => sum + getWeight(sk.source),
          0
        )
        const stagePct =
          stageSkills.length === 0
            ? 0
            : Math.round((stageWeight / stageSkills.length) * 100)

        return (
          <div
            key={stage.level}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600">{stage.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {stageSkills.filter((s) => s.source !== 'none').length}/
                  {stageSkills.length}
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
            <div className="px-4 py-2 flex flex-col gap-0">
              {stageSkills.map((skill, i) => {
                const { label, color } = sourceLabel(skill.source)
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${
                        skill.source === 'cert'
                          ? 'bg-green-400'
                          : skill.source === 'practical'
                            ? 'bg-amber-400'
                            : skill.source === 'study'
                              ? 'bg-indigo-400'
                              : 'bg-gray-200'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">
                        {skill.name}
                      </p>
                      {skill.source === 'none' && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('requiredTags')}:{' '}
                          {skill.tags.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${color}`}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-400">
        {t('gapNote')}
      </div>
    </div>
  )
}
