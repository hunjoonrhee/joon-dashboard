'use client';

import { supabase } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';

export interface UserContext {
  careerLevel: string;
  recentTags: string[];
  gapSkills: string[];
  projects: string[];
  goal: string;
  tilHistory: string[];
}

export async function loadUserContext(topic: string): Promise<UserContext> {
  try {
    const [settingsRes, sessionsRes, roadmapRes, projectsRes] = await Promise.all([
      supabase.from('settings').select('key, value').in('key', ['career_level', 'adopted_roadmap_id']),
      supabase.from('sessions').select('tags, date, til').order('date', { ascending: false }).limit(30),
      supabase.from('ai_roadmaps').select('goal, stages').eq('adopted', true).single(),
      supabase.from('projects').select('name').eq('status', 'in_progress').limit(5),
    ]);

    const careerLevel =
      settingsRes.data?.find((s: { key: string; value: string }) => s.key === 'career_level')?.value ?? 'Not specified';

    const sessions = sessionsRes.data ?? [];
    const recentTags = [...new Set(sessions.flatMap((s: { tags: string[] }) => s.tags))] as string[];

    const tilHistory = sessions
      .filter((s: { til?: string }) => s.til && s.til.trim().length > 0)
      .map((s: { til: string }) => s.til)
      .slice(0, 5);

    const adoptedRoadmap = roadmapRes.data as AiRoadmap | null;
    const studiedTagSet = new Set(recentTags);
    const gapSkills = adoptedRoadmap
      ? adoptedRoadmap.stages.flatMap((stage) =>
          stage.skills
            .filter((sk) => !sk.tags.some((tag: string) => studiedTagSet.has(tag)))
            .map((sk) => sk.name)
        )
      : [];

    const projects = (projectsRes.data ?? []).map((p: { name: string }) => p.name);

    return {
      careerLevel,
      recentTags,
      gapSkills,
      projects,
      goal: adoptedRoadmap?.goal ?? topic,
      tilHistory,
    };
  } catch {
    return {
      careerLevel: 'Not specified',
      recentTags: [],
      gapSkills: [],
      projects: [],
      goal: topic,
      tilHistory: [],
    };
  }
}
