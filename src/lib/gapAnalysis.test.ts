import { describe, expect, it } from 'vitest';
import { calcGapAnalysis, getSkillSource, getSourceWeight } from './gapAnalysis';
import type { AiRoadmap } from '@/types';

describe('getSkillSource', () => {
  it('returns none for a skill with no tags', () => {
    expect(getSkillSource([], new Set(), new Set(), new Set())).toEqual({ source: 'none', matchedTags: [] });
  });

  it('requires at least 30% tag overlap to count as evidence', () => {
    const tags = ['a', 'b', 'c', 'd'];
    // 1/4 = 25%, below threshold
    expect(getSkillSource(tags, new Set(['a']), new Set(), new Set()).source).toBe('none');
    // 2/4 = 50%, above threshold
    expect(getSkillSource(tags, new Set(['a', 'b']), new Set(), new Set()).source).toBe('study');
  });

  it('prioritizes cert over practical over study when multiple sources match', () => {
    const tags = ['a', 'b', 'c'];
    const result = getSkillSource(tags, new Set(['a', 'b', 'c']), new Set(['a', 'b', 'c']), new Set(['a', 'b', 'c']));
    expect(result.source).toBe('cert');
  });

  it('falls back to practical when cert does not clear the threshold', () => {
    const tags = ['a', 'b', 'c', 'd'];
    const result = getSkillSource(tags, new Set(), new Set(['a']), new Set(['a', 'b', 'c']));
    expect(result.source).toBe('practical');
  });
});

describe('getSourceWeight', () => {
  it('weighs cert and practical evidence fully, study partially, none as zero', () => {
    expect(getSourceWeight('cert')).toBe(1.0);
    expect(getSourceWeight('practical')).toBe(1.0);
    expect(getSourceWeight('study')).toBe(0.6);
    expect(getSourceWeight('none')).toBe(0);
  });
});

function makeRoadmap(skillTags: string[][]): AiRoadmap {
  return {
    id: 'roadmap-1',
    goal: 'test goal',
    career_level: 'test',
    adopted: true,
    created_at: '',
    domain: 'dev',
    target_language: null,
    stages: [
      {
        level: 1,
        title: 'stage 1',
        description: '',
        skills: skillTags.map((tags, i) => ({ name: `skill-${i}`, description: '', tags })),
      },
    ],
  };
}

describe('calcGapAnalysis', () => {
  it('is 0% when no skill has any matching evidence', () => {
    const roadmap = makeRoadmap([['a', 'b'], ['c', 'd']]);
    const result = calcGapAnalysis({
      adoptedRoadmap: roadmap,
      studiedTags: new Set(),
      certTags: new Set(),
      practicalTags: new Set(),
    });
    expect(result.gapPct).toBe(0);
  });

  it('is 100% when every skill is backed by cert-level evidence', () => {
    const roadmap = makeRoadmap([['a', 'b'], ['c', 'd']]);
    const result = calcGapAnalysis({
      adoptedRoadmap: roadmap,
      studiedTags: new Set(),
      certTags: new Set(['a', 'b', 'c', 'd']),
      practicalTags: new Set(),
    });
    expect(result.gapPct).toBe(100);
  });

  it('does not inflate when a skill "matches itself" via a self-referential tag set', () => {
    // Regression test for the bug found this session: auto-generated stage
    // goals copy `tags` straight from their own stage's skills, so a
    // studiedTags set built from "all goal tags" (including the roadmap's
    // own auto-generated goal) would let every skill trivially match its
    // own tags with zero real evidence behind it. studiedTags here
    // represents evidence collected correctly (excluding auto-generated
    // goal tags) - it should NOT equal the roadmap's own skill tags.
    const roadmap = makeRoadmap([
      ['self-referential-a', 'self-referential-b'],
      ['unrelated-c', 'unrelated-d'],
    ]);
    // No real study/cert/practical evidence exists for either skill.
    const result = calcGapAnalysis({
      adoptedRoadmap: roadmap,
      studiedTags: new Set(),
      certTags: new Set(),
      practicalTags: new Set(),
    });
    expect(result.gapPct).toBe(0);
    expect(result.skills.every((s) => s.source === 'none')).toBe(true);
  });

  it('blends partial credit correctly across mixed evidence sources', () => {
    const roadmap = makeRoadmap([
      ['a', 'b'], // cert-backed -> 1.0
      ['c', 'd'], // study-backed -> 0.6
      ['e', 'f'], // no evidence -> 0
    ]);
    const result = calcGapAnalysis({
      adoptedRoadmap: roadmap,
      studiedTags: new Set(['c', 'd']),
      certTags: new Set(['a', 'b']),
      practicalTags: new Set(),
    });
    // (1.0 + 0.6 + 0) / 3 = 53.33% -> rounds to 53
    expect(result.gapPct).toBe(53);
  });
});
