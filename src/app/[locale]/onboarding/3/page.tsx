'use client';

import { supabase as supabaseClient, upsertWithUser } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RoadmapStage {
  level: number;
  title: string;
  description: string;
  skills: { name: string; tags: string[] }[];
}

export default function Onboarding3() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const supabase = createSupabaseBrowserClient();

  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ob_goal = sessionStorage.getItem('ob_goal');
    const ob_level = sessionStorage.getItem('ob_level');
    const ob_stages = sessionStorage.getItem('ob_stages');

    if (!ob_goal) {
      router.push(`/${locale}/onboarding/1`);
      return;
    }

    setGoal(ob_goal);

    if (ob_stages) {
      try {
        setStages(JSON.parse(ob_stages));
        setLoading(false);
        return;
      } catch {}
    }

    if (ob_level) {
      generateRoadmap(ob_goal, ob_level);
    } else {
      router.push(`/${locale}/onboarding/2`);
    }
  }, []);

  const generateRoadmap = async (goal: string, level: string) => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          careerLevel: level,
          locale,
          userId: user?.id,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStages(data.stages ?? []);
    } catch {
      setError(t('step3Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ob_level = sessionStorage.getItem('ob_level') ?? '';

      // 로드맵 DB 저장 + 자동 채택
      if (stages.length > 0) {
        const { data: roadmap } = await supabaseClient
          .from('ai_roadmaps')
          .insert({
            goal,
            career_level: ob_level,
            stages,
            adopted: false,
            user_id: user.id,
          })
          .select()
          .single();

        if (roadmap) {
          await upsertWithUser(
            'settings',
            { key: 'adopted_roadmap_id', value: roadmap.id },
            { onConflict: 'key,user_id' }
          );
        }
      }

      await Promise.all([
        upsertWithUser(
          'settings',
          { key: 'onboarding_completed', value: 'true' },
          { onConflict: 'key,user_id' }
        ),
        upsertWithUser(
          'settings',
          { key: 'big_goal', value: goal },
          { onConflict: 'key,user_id' }
        ),
        upsertWithUser(
          'settings',
          { key: 'big_goal_sub', value: ob_level },
          { onConflict: 'key,user_id' }
        ),
      ]);

      sessionStorage.removeItem('ob_domain');
      sessionStorage.removeItem('ob_goal');
      sessionStorage.removeItem('ob_level');
      sessionStorage.removeItem('ob_stages');

      router.push(`/${locale}/dashboard`);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
        </div>
        <p className="text-xs text-gray-500 mb-1">{t('step3of3')}</p>

        {loading ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4 animate-pulse">✦</div>
            <h2 className="text-lg font-bold text-white mb-2">
              {t('step3Loading')}
            </h2>
            <p className="text-sm text-gray-500">{t('step3LoadingSub')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button
              onClick={() => {
                const g = sessionStorage.getItem('ob_goal') ?? '';
                const l = sessionStorage.getItem('ob_level') ?? '';
                generateRoadmap(g, l);
              }}
              className="px-4 py-2 bg-indigo-500 rounded-lg text-sm font-medium text-white"
            >
              {t('step3Error')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-1">{goal} 🎉</h2>
            <p className="text-sm text-gray-500 mb-5">
              {stages.length} {t('step3Stages')}
            </p>

            <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl border border-white/5"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === stages.length - 1 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                  >
                    {stage.level}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${i === stages.length - 1 ? 'text-indigo-300' : 'text-white'}`}
                    >
                      {stage.title} {i === stages.length - 1 && '🏆'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-sm font-bold text-white transition-colors"
            >
              {saving ? t('step3Saving') : t('step3SaveBtn')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
