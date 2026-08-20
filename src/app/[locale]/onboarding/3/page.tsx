'use client';

import AddSessionModal from '@/components/AddSessionModal';
import { CompassDial } from '@/components/compass-dial';
import { supabase as supabaseClient, upsertWithUser } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { PenLine, Rocket, Sparkles, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RoadmapStage {
  level: number;
  title: string;
  description: string;
  skills: { name: string; tags: string[] }[];
}

type Step = 'roadmap' | 'cta';

export default function Onboarding3() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('onboarding');
  const supabase = createSupabaseBrowserClient();

  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [domain, setDomain] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>('roadmap');
  const [showSessionModal, setShowSessionModal] = useState(false);

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
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          careerLevel: level,
          locale,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStages(data.stages ?? []);
      setDomain(data.domain ?? null);
      setTargetLanguage(data.targetLanguage ?? null);
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

      if (stages.length > 0) {
        const { data: roadmap } = await supabaseClient
          .from('ai_roadmaps')
          .insert({
            goal,
            career_level: ob_level,
            stages,
            domain,
            target_language: targetLanguage,
            adopted: true,
            user_id: user.id,
          })
          .select()
          .single();

        if (roadmap) {
          // Onboarding only ever creates one roadmap, but un-adopt any others
          // defensively (same as RoadmapTab's real adopt flow) in case this
          // ever runs for a user who already has one from elsewhere.
          await supabaseClient.from('ai_roadmaps').update({ adopted: false }).neq('id', roadmap.id);
          await upsertWithUser(
            'settings',
            { key: 'adopted_roadmap_id', value: roadmap.id },
            { onConflict: 'key,user_id' }
          );
        }
      }

      await Promise.all([
        upsertWithUser('settings', { key: 'onboarding_completed', value: 'true' }, { onConflict: 'key,user_id' }),
        upsertWithUser('settings', { key: 'big_goal', value: goal }, { onConflict: 'key,user_id' }),
        upsertWithUser('settings', { key: 'big_goal_sub', value: ob_level }, { onConflict: 'key,user_id' }),
      ]);

      sessionStorage.removeItem('ob_domain');
      sessionStorage.removeItem('ob_goal');
      sessionStorage.removeItem('ob_level');
      sessionStorage.removeItem('ob_stages');

      setStep('cta');
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const goToDashboard = () => router.push(`/${locale}/dashboard`);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surf border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-pri" />
          <div className="flex-1 h-1 rounded-full bg-pri" />
        </div>
        <p className="text-xs text-ink-faint mb-1">{t('step3of3')}</p>

        {step === 'roadmap' && (
          <>
            {loading ? (
              <div className="text-center py-10">
                <Sparkles size={32} strokeWidth={1.8} className="text-pri mx-auto mb-4 animate-pulse" />
                <h2 className="text-lg font-bold text-ink mb-2">{t('step3Loading')}</h2>
                <p className="text-sm text-ink-faint">{t('step3LoadingSub')}</p>
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
                  className="px-4 py-2 bg-pri rounded-lg text-sm font-medium text-on-pri"
                >
                  {t('step3Error')}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-ink mb-1">{goal}</h2>
                <p className="text-sm text-ink-faint mb-5">
                  {stages.length} {t('step3Stages')}
                </p>

                <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto">
                  {stages.map((stage, i) => {
                    const isLast = i === stages.length - 1;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-surf-2 rounded-xl border border-border">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isLast ? 'bg-pri text-on-pri' : 'bg-border text-ink-dim'}`}
                        >
                          {stage.level}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-semibold flex items-center gap-1 ${isLast ? 'text-pri' : 'text-ink'}`}
                          >
                            {stage.title}
                            {isLast && <Trophy size={13} strokeWidth={1.8} />}
                          </p>
                          <p className="text-xs text-ink-faint mt-0.5">{stage.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleStart}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-pri hover:opacity-90 disabled:opacity-50 text-sm font-bold text-on-pri transition-colors"
                >
                  {saving ? t('step3Saving') : t('step3SaveBtn')}
                </button>
              </>
            )}
          </>
        )}

        {step === 'cta' && (
          <div className="flex flex-col gap-4">
            <div className="text-center py-4">
              <Rocket size={32} strokeWidth={1.8} className="text-pri mx-auto mb-3" />
              <h2 className="text-xl font-bold text-ink mb-2">{t('step3CtaTitle')}</h2>
              <p className="text-sm text-ink-dim">{t('step3CtaSub')}</p>
            </div>

            <div className="bg-surf-2 border border-border rounded-xl p-4 flex items-center gap-3">
              <CompassDial percent={0} size={44} showLabel={false} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-dim">{t('step3CtaProgress')}</p>
                  <span className="text-xs font-bold text-pri flex-shrink-0">0 / 3</span>
                </div>
                <p className="text-xs text-ink-faint mt-1">{t('step3CtaProgressSub')}</p>
              </div>
            </div>

            <button
              onClick={() => setShowSessionModal(true)}
              className="w-full py-3 rounded-xl bg-pri hover:opacity-90 text-sm font-bold text-on-pri transition-colors flex items-center justify-center gap-2"
            >
              <PenLine size={15} strokeWidth={1.8} />
              {t('step3CtaAddSession')}
            </button>

            <button
              onClick={goToDashboard}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-ink-dim hover:text-ink hover:border-pri/40 transition-colors"
            >
              {t('step3CtaSkip')}
            </button>
          </div>
        )}
      </div>

      {showSessionModal && <AddSessionModal onClose={() => setShowSessionModal(false)} onSaved={goToDashboard} />}
    </div>
  );
}
