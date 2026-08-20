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
  /** Set only when the adopted roadmap is a language-learning goal - drives whether /api/tutor/chat generates vocabWords. */
  targetLanguage: string | null;
  /** So tutor-created sessions can be tagged with roadmap_id like every other session-creating flow (AddSessionModal) - without it, Home's roadmap-scoped queries (TIL, streak) never see these sessions. */
  adoptedRoadmapId: string | null;
}

/**
 * languageOverride lets a session practice a language other than the adopted
 * roadmap's own target_language (mobile lets the user pick language + scenario
 * before starting a roleplay, independent of what roadmap happens to be adopted).
 */
export async function loadUserContext(topic: string, languageOverride?: string | null): Promise<UserContext> {
  try {
    const [settingsRes, sessionsRes, roadmapRes, projectsRes] = await Promise.all([
      supabase.from('settings').select('key, value').in('key', ['career_level', 'adopted_roadmap_id']),
      supabase.from('sessions').select('tags, date, til').order('date', { ascending: false }).limit(30),
      supabase.from('ai_roadmaps').select('id, goal, stages, target_language, career_level').eq('adopted', true).single(),
      supabase.from('projects').select('name').eq('status', 'in_progress').limit(5),
    ]);

    const settingsCareerLevel = settingsRes.data?.find(
      (s: { key: string; value: string }) => s.key === 'career_level'
    )?.value;

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
          stage.skills.filter((sk) => !sk.tags.some((tag: string) => studiedTagSet.has(tag))).map((sk) => sk.name)
        )
      : [];

    const projects = (projectsRes.data ?? []).map((p: { name: string }) => p.name);

    // adoptedRoadmap.career_level reflects the level actually assessed for the
    // roadmap currently being practiced (e.g. "독일어 C1"); settings.career_level
    // is a one-time onboarding snapshot that never gets updated afterward and
    // can go stale the moment the user adopts a different or refined roadmap.
    const careerLevel = adoptedRoadmap?.career_level || settingsCareerLevel || 'Not specified';

    return {
      careerLevel,
      recentTags,
      gapSkills,
      projects,
      goal: adoptedRoadmap?.goal ?? topic,
      tilHistory,
      targetLanguage: languageOverride ?? adoptedRoadmap?.target_language ?? null,
      adoptedRoadmapId: adoptedRoadmap?.id ?? null,
    };
  } catch {
    return {
      careerLevel: 'Not specified',
      recentTags: [],
      gapSkills: [],
      projects: [],
      goal: topic,
      tilHistory: [],
      targetLanguage: languageOverride ?? null,
      adoptedRoadmapId: null,
    };
  }
}
