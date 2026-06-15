import type { AiRoadmap } from '@/types';

export type TrustSource = 'cert' | 'practical' | 'study' | 'none';

export interface SkillWithSource {
  name: string;
  tags: string[];
  source: TrustSource;
  matchedTags: string[];
}

export interface GapAnalysisInput {
  adoptedRoadmap: AiRoadmap;
  studiedTags: Set<string>;
  certTags: Set<string>;
  practicalTags: Set<string>;
}

export interface GapAnalysisResult {
  gapPct: number;
  totalWeight: number;
  maxWeight: number;
  skills: SkillWithSource[];
}

export function getSkillSource(
  tags: string[],
  studiedTags: Set<string>,
  certTags: Set<string>,
  practicalTags: Set<string>
): { source: TrustSource; matchedTags: string[] } {
  if (tags.length === 0) return { source: 'none', matchedTags: [] };

  const certMatched = tags.filter((tag) => certTags.has(tag));
  if (certMatched.length / tags.length >= 0.3) return { source: 'cert', matchedTags: certMatched };

  const practicalMatched = tags.filter((tag) => practicalTags.has(tag));
  if (practicalMatched.length / tags.length >= 0.3) return { source: 'practical', matchedTags: practicalMatched };

  const studyMatched = tags.filter((tag) => studiedTags.has(tag));
  if (studyMatched.length / tags.length >= 0.3) return { source: 'study', matchedTags: studyMatched };

  return { source: 'none', matchedTags: [] };
}

export function getSourceWeight(source: TrustSource): number {
  if (source === 'cert') return 1.0;
  if (source === 'practical') return 1.0;
  if (source === 'study') return 0.6;
  return 0;
}

export function calcGapAnalysis({
  adoptedRoadmap,
  studiedTags,
  certTags,
  practicalTags,
}: GapAnalysisInput): GapAnalysisResult {
  const skills = adoptedRoadmap.stages.flatMap((s) =>
    s.skills.map((sk): SkillWithSource => {
      const { source, matchedTags } = getSkillSource(sk.tags, studiedTags, certTags, practicalTags);
      return { name: sk.name, tags: sk.tags, source, matchedTags };
    })
  );

  const totalWeight = skills.reduce((sum, sk) => sum + getSourceWeight(sk.source), 0);
  const maxWeight = skills.length;
  const gapPct = maxWeight === 0 ? 0 : Math.round((totalWeight / maxWeight) * 100);

  return { gapPct, totalWeight, maxWeight, skills };
}
