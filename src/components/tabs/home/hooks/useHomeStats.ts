'use client';

import { useSessions } from '@/lib/queries';
import { calcGapAnalysis } from '@/lib/gapAnalysis';
import { calcMaxStreak, calcStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';
import type { AiRoadmap, Goal, Session, Topic } from '@/types';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

interface UseHomeStatsParams {
  adoptedRoadmapId: string | null;
  adoptedRoadmap: AiRoadmap | null;
  topics: Topic[];
  goals: Goal[];
  allSessions: Session[];
}

interface WeekDay {
  label: string;
  hasSession: boolean;
  isToday: boolean;
}

interface WeeklyStats {
  hours: number;
  tilCount: number;
}

interface UseHomeStatsReturn {
  sessions: Session[];
  streak: number;
  maxStreak: number;
  monthCount: number;
  overallPct: number;
  completedTopics: Topic[];
  gapPct: number | null;
  week: WeekDay[];
  weeklyStats: WeeklyStats;
}

export function useHomeStats({
  adoptedRoadmapId,
  adoptedRoadmap,
  topics,
  goals,
  allSessions,
}: UseHomeStatsParams): UseHomeStatsReturn {
  const locale = useLocale();
  const { data: roadmapSessions = [] } = useSessions(adoptedRoadmapId);
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

  const streak = calcStreak(roadmapSessions);
  const maxStreak = calcMaxStreak(roadmapSessions);

  const thisMonth = new Date().getMonth();
  const monthCount = roadmapSessions.filter((s) => new Date(s.date).getMonth() === thisMonth).length;

  // Switching the adopted roadmap (RoadmapTab's "채택하기") only manages
  // is_focus on the newly-adopted roadmap's own auto-generated goal - it
  // never clears is_focus on a goal left over from a previously-adopted,
  // now-unrelated roadmap. Scoping here (not just by is_focus) stops a
  // stale goal from a roadmap the user isn't even on anymore from leaking
  // into the progress dial.
  const focusGoals = goals.filter((g) => g.is_focus && (g.roadmap_id === null || g.roadmap_id === adoptedRoadmapId));
  const totalTopics = topics.filter((t) => focusGoals.some((g) => g.id === t.goal_id));
  const completedTopics = totalTopics.filter((t) => t.completed);
  const overallPct = totalTopics.length === 0 ? 0 : Math.round((completedTopics.length / totalTopics.length) * 100);

  const gapPct = (() => {
    if (!adoptedRoadmap) return null;
    // Auto-generated stage goals get `tags` copied straight from that
    // stage's own skills at adoption time, so including them here would let
    // every skill trivially "match itself" with zero real evidence behind
    // it - only manually-created goals' tags (a deliberate user choice) count.
    const studiedTags = new Set([
      ...roadmapSessions.flatMap((s) => s.tags),
      ...goals.filter((g) => !g.is_auto_generated).flatMap((g) => g.tags ?? []),
    ]);
    const { gapPct } = calcGapAnalysis({ adoptedRoadmap, studiedTags, certTags, practicalTags });
    return gapPct;
  })();

  const week = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        label: d
          .toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' })
          .slice(0, 2),
        hasSession: roadmapSessions.some((s) => s.date === dateStr),
        isToday: d.toDateString() === today.toDateString(),
      };
    });
  })();

  const weeklyStats = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weeklySessions = roadmapSessions.filter((s) => {
      const sd = new Date(s.date);
      return sd >= monday && sd <= today;
    });
    return {
      hours: Math.round((weeklySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60) * 10) / 10,
      tilCount: weeklySessions.filter((s) => s.til).length,
    };
  })();

  return {
    sessions: roadmapSessions,
    streak,
    maxStreak,
    monthCount,
    overallPct,
    completedTopics,
    gapPct,
    week,
    weeklyStats,
  };
}
