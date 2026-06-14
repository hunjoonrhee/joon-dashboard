'use client';

import { supabase } from '@/lib/supabase';
import type {
  Goal,
  Project,
  ProjectTask,
  Session,
  Setting,
  TodayItem,
  Topic,
} from '@/types';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GoalsTab from './tabs/GoalsTab';
import HomeTab from './tabs/HomeTab';
import ProjectsTab from './tabs/ProjectsTab';
import StudyTab from './tabs/StudyTab';

type Tab = 'home' | 'study' | 'goals' | 'projects';

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [s, t, g, st, ti, p, pt] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: false }),
        supabase.from('topics').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('settings').select('*'),
        supabase
          .from('today_items')
          .select('*')
          .eq('date', today)
          .order('created_at'),
        supabase.from('projects').select('*').order('order_index'),
        supabase.from('project_tasks').select('*').order('order_index'),
      ]);
      if (s.data) setSessions(s.data);
      if (t.data) setTopics(t.data);
      if (g.data) setGoals(g.data);
      if (st.data) {
        const map: Record<string, string> = {};
        st.data.forEach((s: Setting) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      }
      if (ti.data) setTodayItems(ti.data);
      if (p.data) setProjects(p.data);
      if (pt.data) setProjectTasks(pt.data);
      setLoading(false);
    };
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    const handleFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </main>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 h-13 flex items-center justify-between px-5 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">
            🎯
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {settings.name ?? 'Joon'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('de-DE', {
              timeZone: 'Europe/Berlin',
            })}
          </span>
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <Settings size={17} />
          </button>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-100 flex px-5 sticky top-13 z-10">
        {(['home', 'study', 'goals', 'projects'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
              tab === t
                ? 'text-indigo-500 border-indigo-500'
                : 'text-gray-400 border-transparent'
            }`}
          >
            {t === 'home'
              ? '홈'
              : t === 'study'
                ? '공부 기록'
                : t === 'goals'
                  ? '목표'
                  : '프로젝트'}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-4 py-4">
        {tab === 'home' && (
          <HomeTab
            sessions={sessions}
            topics={topics}
            goals={goals}
            settings={settings}
            todayItems={todayItems}
            onRefresh={refresh}
          />
        )}
        {tab === 'study' && (
          <StudyTab sessions={sessions} onRefresh={refresh} />
        )}
        {tab === 'goals' && (
          <GoalsTab topics={topics} goals={goals} onRefresh={refresh} />
        )}
        {tab === 'projects' && (
          <ProjectsTab
            projects={projects}
            projectTasks={projectTasks}
            onRefresh={refresh}
          />
        )}
      </div>
    </div>
  );
}
