import type { Goal, RoadmapStage, Topic } from '@/types';

/**
 * Which goals count toward the Home progress dial (overallPct). Switching
 * the adopted roadmap only manages is_focus on the newly-adopted roadmap's
 * own auto-generated goal - it never clears is_focus on a goal left over
 * from whatever was adopted before, so is_focus alone isn't a safe filter.
 * Scoped to goals belonging to the currently adopted roadmap, plus any
 * fully independent goal (no roadmap_id at all).
 */
export function scopeFocusGoals(goals: Goal[], adoptedRoadmapId: string | null): Goal[] {
  return goals.filter((g) => g.is_focus && (g.roadmap_id === null || g.roadmap_id === adoptedRoadmapId));
}

/** overallPct: the raw topic-checkbox completion rate within the scoped focus goals. */
export function computeOverallPct(topics: Topic[], focusGoals: Goal[]): number {
  const focusGoalIds = new Set(focusGoals.map((g) => g.id));
  const totalTopics = topics.filter((t) => t.goal_id !== null && focusGoalIds.has(t.goal_id));
  if (totalTopics.length === 0) return 0;
  const completed = totalTopics.filter((t) => t.completed).length;
  return Math.round((completed / totalTopics.length) * 100);
}

/**
 * Builds one Topic insert payload per skill across all stages, so the
 * checklist a user actually checks off (topics -> overallPct) starts out
 * matching what the AI roadmap already generated (stage.skills), instead of
 * requiring the user to hand-retype the whole curriculum before the
 * progress dial can ever move. `category` defaults to 'general' - skills
 * don't carry their own sub-grouping, same default the manual add-topic
 * flow already uses. Pure (no Supabase import) so it's directly unit-
 * testable without needing env vars or a live client.
 */
export function buildTopicPayloadsFromStages(stages: RoadmapStage[], goalIdByStageLevel: Map<number, string>) {
  return stages.flatMap((stage) => {
    const goalId = goalIdByStageLevel.get(stage.level);
    if (!goalId) return [];
    return stage.skills.map((skill) => ({
      name: skill.name,
      category: 'general',
      goal_id: goalId,
      completed: false,
    }));
  });
}
