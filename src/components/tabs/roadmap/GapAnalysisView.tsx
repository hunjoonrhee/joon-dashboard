'use client';

import { CompassDial } from '@/components/compass-dial';
import { calcGapAnalysis, getSourceWeight, type SkillWithSource, type TrustSource } from '@/lib/gapAnalysis';
import { supabase } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';
import { Award, BarChart2, BookOpen, Circle, Zap, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Props {
  adoptedRoadmap: AiRoadmap | null;
  studiedTags: Set<string>;
  onGoToAi: () => void;
}

interface SourceLabelConfig {
  label: string;
  color: string;
}

const sourceIcon: Record<TrustSource, LucideIcon> = {
  cert: Award,
  practical: Zap,
  study: BookOpen,
  none: Circle,
};

export default function GapAnalysisView({ adoptedRoadmap, studiedTags, onGoToAi }: Props) {
  const t = useTranslations('roadmap');
  const [certTags, setCertTags] = useState<Set<string>>(new Set());
  const [practicalTags, setPracticalTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const [certsRes, projectSkillsRes] = await Promise.all([
        supabase.from('certifications').select('tags'),
        supabase.from('project_skills').select('tags'),
      ]);
      if (certsRes.data) {
        setCertTags(new Set((certsRes.data as { tags: string[] }[]).flatMap((c) => c.tags)));
      }
      if (projectSkillsRes.data) {
        setPracticalTags(new Set((projectSkillsRes.data as { tags: string[] }[]).flatMap((ps) => ps.tags)));
      }
    };
    load();
  }, []);

  if (!adoptedRoadmap) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <BarChart2 size={28} strokeWidth={1.8} className="text-ink-faint" />
        <p className="text-sm font-semibold text-ink">{t('noAdoptedRoadmap')}</p>
        <button
          onClick={onGoToAi}
          className="px-4 py-2 rounded-lg bg-pri text-on-pri text-xs font-semibold hover:opacity-90 transition-colors"
        >
          {t('generateFirst')}
        </button>
      </div>
    );
  }

  const {
    gapPct,
    totalWeight,
    maxWeight,
    skills: allSkills,
  } = calcGapAnalysis({
    adoptedRoadmap,
    studiedTags,
    certTags,
    practicalTags,
  });

  const gapDialColor = gapPct >= 70 ? 'var(--color-ok)' : gapPct >= 40 ? 'var(--color-amber)' : '#e26a5c';

  const sourceLabel = (source: TrustSource): SourceLabelConfig => {
    if (source === 'cert') return { label: t('sourceCert'), color: 'bg-green-50 text-green-600 border-green-100' };
    if (source === 'practical')
      return { label: t('sourcePractical'), color: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (source === 'study') return { label: t('sourceStudy'), color: 'bg-surf-2 text-pri border-border' };
    return { label: t('sourceNone'), color: 'bg-surf-2 text-ink-faint border-border' };
  };

  const getSkillsForStage = (stageSkills: AiRoadmap['stages'][0]['skills']): SkillWithSource[] =>
    allSkills.filter((sk) => stageSkills.some((s) => s.name === sk.name));

  return (
    <div className="flex flex-col gap-4">
      {/* 전체 일치도 */}
      <div className="bg-surf border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <CompassDial
            percent={gapPct}
            size={88}
            showLabel
            colorFrom={gapDialColor}
            colorTo={gapDialColor}
            tickActiveColor={gapDialColor}
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink mb-1">{t('gapTitle')}</p>
            <p className="text-xs text-ink-faint">
              {t('gapSummary', {
                studied: Math.round(totalWeight * 10) / 10,
                total: maxWeight,
              })}
              {' · '}
              {adoptedRoadmap.goal}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-border">
          {(['cert', 'practical', 'study', 'none'] as const).map((source) => {
            const { label, color } = sourceLabel(source);
            const Icon = sourceIcon[source];
            return (
              <span key={source} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${color}`}>
                <Icon size={11} strokeWidth={2} />
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* 단계별 갭 */}
      {adoptedRoadmap.stages.map((stage) => {
        const stageSkills = getSkillsForStage(stage.skills);
        const stageWeight = stageSkills.reduce((sum, sk) => sum + getSourceWeight(sk.source), 0);
        const stagePct = stageSkills.length === 0 ? 0 : Math.round((stageWeight / stageSkills.length) * 100);

        return (
          <div key={stage.level} className="bg-surf border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs font-bold text-ink-dim">{stage.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-faint">
                  {stageSkills.filter((s) => s.source !== 'none').length}/{stageSkills.length}
                </span>
                <span
                  className={`text-xs font-bold ${stagePct >= 70 ? 'text-green-500' : stagePct >= 40 ? 'text-amber' : 'text-ink-faint'}`}
                >
                  {stagePct}%
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex flex-col gap-0">
              {stageSkills.map((skill, i) => {
                const { label, color } = sourceLabel(skill.source);
                return (
                  <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${
                        skill.source === 'cert'
                          ? 'bg-green-400'
                          : skill.source === 'practical'
                            ? 'bg-amber-400'
                            : skill.source === 'study'
                              ? 'bg-pri-2'
                              : 'bg-border'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink">{skill.name}</p>
                      {skill.source === 'none' && (
                        <p className="text-xs text-ink-faint mt-0.5">
                          {t('requiredTags')}: {skill.tags.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${color}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-surf-2 border border-border rounded-lg px-3 py-2 text-xs text-ink-faint">{t('gapNote')}</div>
    </div>
  );
}
