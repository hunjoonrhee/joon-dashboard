import { supabase } from '@/lib/supabase';
import type { Goal, Note, Project, ProjectTask, Session, Setting, TodayItem, Topic } from '@/types';
import { useQuery } from '@tanstack/react-query';

// ─── Sessions ───────────────────────────────────────────
export const useSessions = () =>
  useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false });
      return (data ?? []) as Session[];
    },
  });

// ─── Topics ─────────────────────────────────────────────
export const useTopics = () =>
  useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('*');
      return (data ?? []) as Topic[];
    },
  });

// ─── Goals ──────────────────────────────────────────────
export const useGoals = () =>
  useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await supabase.from('goals').select('*');
      return (data ?? []) as Goal[];
    },
  });

// ─── Settings ───────────────────────────────────────────
export const useSettings = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const map: Record<string, string> = {};
      (data ?? []).forEach((s: Setting) => {
        map[s.key] = s.value;
      });
      return map;
    },
  });

// ─── Today Items ────────────────────────────────────────
export const useTodayItems = () => {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['today_items', today],
    queryFn: async () => {
      const { data } = await supabase.from('today_items').select('*').eq('date', today).order('created_at');
      return (data ?? []) as TodayItem[];
    },
  });
};

// ─── Projects ───────────────────────────────────────────
export const useProjects = () =>
  useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').order('order_index');
      return (data ?? []) as Project[];
    },
  });

// ─── Project Tasks ──────────────────────────────────────
export const useProjectTasks = () =>
  useQuery({
    queryKey: ['project_tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('project_tasks').select('*').order('order_index');
      return (data ?? []) as ProjectTask[];
    },
  });

// ─── Notes ──────────────────────────────────────────────
export const useNotes = (limit?: number) =>
  useQuery({
    queryKey: ['notes', limit],
    queryFn: async () => {
      let q = supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      return (data ?? []) as Note[];
    },
  });
