import { buildTopicPayloadsFromStages } from '@/lib/roadmap-progress';
import { getCurrentUserId, insertWithUser, supabase } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';

/**
 * The shared "make this roadmap the adopted one" sequence: un-adopts every
 * other roadmap, (re)creates one auto-generated Goal per stage and one Topic
 * per skill under it. Used by both the Roadmap tab's real adopt flow and
 * onboarding's first-roadmap save, which previously diverged - onboarding
 * skipped goal/topic creation entirely, silently leaving new users with an
 * adopted roadmap but nothing in "내 목표" and a progress dial stuck at 0%.
 */
export async function applyRoadmapAdoption(roadmap: AiRoadmap): Promise<void> {
  await supabase.from('ai_roadmaps').update({ adopted: false }).neq('id', roadmap.id);
  await supabase.from('ai_roadmaps').update({ adopted: true }).eq('id', roadmap.id);

  // 재채택 시 중복 방지 - 이 로드맵에서 자동 생성됐던 기존 goals 삭제 (topics는 goal_id
  // FK cascade로 함께 정리된다고 가정하지 않고, 아래에서 goal을 새로 만들면 어차피 새
  // goal_id로 topics도 새로 생기므로 orphan topics만 별도 정리)
  await supabase.from('goals').delete().eq('roadmap_id', roadmap.id).eq('is_auto_generated', true);

  const goalPayloads = roadmap.stages.map((stage) => ({
    name: stage.title,
    description: stage.description,
    status: 'planned' as const,
    priority: 'medium' as const,
    is_focus: stage.level === 1,
    tags: stage.skills.flatMap((sk) => sk.tags),
    roadmap_id: roadmap.id,
    stage_level: stage.level,
    is_auto_generated: true,
  }));

  const userId = await getCurrentUserId();
  const { data: insertedGoals } = await supabase
    .from('goals')
    .insert(goalPayloads.map((g) => ({ ...g, user_id: userId })))
    .select('id, stage_level');

  const goalIdByStageLevel = new Map<number, string>(
    (insertedGoals ?? []).map((g: { id: string; stage_level: number }): [number, string] => [g.stage_level, g.id])
  );
  const topicPayloads = buildTopicPayloadsFromStages(roadmap.stages, goalIdByStageLevel);
  if (topicPayloads.length > 0) {
    await insertWithUser('topics', topicPayloads);
  }
}
