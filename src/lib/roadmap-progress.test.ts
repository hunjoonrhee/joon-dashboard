import { describe, expect, it } from 'vitest';
import { buildTopicPayloadsFromStages, computeOverallPct, scopeFocusGoals } from './roadmap-progress';
import type { Goal, RoadmapStage, Topic } from '@/types';

function makeGoal(overrides: Partial<Goal>): Goal {
  return {
    id: 'goal-1',
    name: 'Goal',
    description: null,
    status: 'in_progress',
    is_focus: false,
    priority: 'medium',
    tags: [],
    roadmap_id: null,
    stage_level: null,
    created_at: '',
    is_auto_generated: false,
    ...overrides,
  };
}

function makeTopic(overrides: Partial<Topic>): Topic {
  return {
    id: 'topic-1',
    category: 'general',
    name: 'Topic',
    completed: false,
    goal_id: null,
    created_at: '',
    ...overrides,
  };
}

describe('scopeFocusGoals', () => {
  it('excludes a focus goal left over from a previously-adopted, now-unrelated roadmap', () => {
    // Regression test: switching the adopted roadmap doesn't clear is_focus
    // on the old roadmap's auto-generated goal - found live this session
    // (switched roadmaps twice while testing, a checked topic under the old
    // roadmap kept showing up in the new roadmap's progress stats).
    const staleGoal = makeGoal({ id: 'stale', is_focus: true, roadmap_id: 'old-roadmap' });
    const currentGoal = makeGoal({ id: 'current', is_focus: true, roadmap_id: 'new-roadmap' });
    const goals = [staleGoal, currentGoal];

    const result = scopeFocusGoals(goals, 'new-roadmap');

    expect(result.map((g) => g.id)).toEqual(['current']);
  });

  it('still includes independent goals with no roadmap_id at all', () => {
    const independentGoal = makeGoal({ id: 'independent', is_focus: true, roadmap_id: null });
    const result = scopeFocusGoals([independentGoal], 'some-roadmap');
    expect(result.map((g) => g.id)).toEqual(['independent']);
  });

  it('excludes non-focus goals even if they belong to the adopted roadmap', () => {
    const goal = makeGoal({ id: 'not-focus', is_focus: false, roadmap_id: 'new-roadmap' });
    expect(scopeFocusGoals([goal], 'new-roadmap')).toEqual([]);
  });
});

describe('computeOverallPct', () => {
  it('is 0% with no topics under the scoped goals', () => {
    expect(computeOverallPct([], [])).toBe(0);
  });

  it('only counts topics belonging to a scoped focus goal', () => {
    const focusGoals = [makeGoal({ id: 'focus-goal', is_focus: true })];
    const topics = [
      makeTopic({ id: 't1', goal_id: 'focus-goal', completed: true }),
      makeTopic({ id: 't2', goal_id: 'focus-goal', completed: false }),
      // Belongs to a goal outside the scoped set - must not count toward the total.
      makeTopic({ id: 't3', goal_id: 'other-goal', completed: true }),
    ];

    expect(computeOverallPct(topics, focusGoals)).toBe(50);
  });

  it('rounds to the nearest percent', () => {
    const focusGoals = [makeGoal({ id: 'g', is_focus: true })];
    const topics = [
      makeTopic({ goal_id: 'g', completed: true }),
      makeTopic({ goal_id: 'g', completed: false }),
      makeTopic({ goal_id: 'g', completed: false }),
    ];
    // 1/3 = 33.33% -> 33
    expect(computeOverallPct(topics, focusGoals)).toBe(33);
  });
});

function makeStages(): RoadmapStage[] {
  return [
    {
      level: 1,
      title: 'Stage 1',
      description: '',
      skills: [
        { name: 'Skill A', description: '', tags: ['a'] },
        { name: 'Skill B', description: '', tags: ['b'] },
      ],
    },
    {
      level: 2,
      title: 'Stage 2',
      description: '',
      skills: [{ name: 'Skill C', description: '', tags: ['c'] }],
    },
  ];
}

describe('buildTopicPayloadsFromStages', () => {
  it("creates one topic per skill, matched to that skill's stage goal", () => {
    const goalIdByStageLevel = new Map([
      [1, 'goal-1'],
      [2, 'goal-2'],
    ]);
    const topics = buildTopicPayloadsFromStages(makeStages(), goalIdByStageLevel);

    expect(topics).toHaveLength(3);
    expect(topics.filter((t) => t.goal_id === 'goal-1').map((t) => t.name)).toEqual(['Skill A', 'Skill B']);
    expect(topics.filter((t) => t.goal_id === 'goal-2').map((t) => t.name)).toEqual(['Skill C']);
    expect(topics.every((t) => t.completed === false)).toBe(true);
  });

  it('skips a stage entirely when its goal was not created (defensive - should not happen in practice)', () => {
    // Regression guard: this is the exact gap that used to leave a brand-new
    // user with an adopted roadmap but zero checkable topics - a stage with
    // no matching goal id must not silently produce topics with a dangling goal_id.
    const goalIdByStageLevel = new Map([[1, 'goal-1']]); // stage 2 missing
    const topics = buildTopicPayloadsFromStages(makeStages(), goalIdByStageLevel);

    expect(topics).toHaveLength(2);
    expect(topics.every((t) => t.goal_id === 'goal-1')).toBe(true);
  });

  it('returns an empty array for a roadmap with no stages', () => {
    expect(buildTopicPayloadsFromStages([], new Map())).toEqual([]);
  });
});
