'use client';

import { Sparkles, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RoadmapStage {
  level: number;
  title: string;
  description: string;
  skills: { name: string; tags: string[] }[];
}

export default function TryPage() {
  const locale = useLocale();
  const t = useTranslations('try');
  const router = useRouter();

  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [stages, setStages] = useState<RoadmapStage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!goal.trim() || !level.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          careerLevel: level.trim(),
          locale,
        }),
      });
      if (res.status === 429) {
        setError(t('rateLimited'));
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStages(data.stages ?? []);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!stages) return;
    const goalTrimmed = goal.trim();
    const levelTrimmed = level.trim();

    // sessionStorage — 같은 탭에서 돌아올 때
    sessionStorage.setItem('ob_goal', goalTrimmed);
    sessionStorage.setItem('ob_level', levelTrimmed);
    sessionStorage.setItem('ob_stages', JSON.stringify(stages));

    // URL 파라미터 — 새 탭/모바일 메일 앱에서 인증 링크 클릭 시 복구용
    const params = new URLSearchParams({
      goal: goalTrimmed,
      level: levelTrimmed,
    });
    router.push(`/${locale}/signup?${params.toString()}`);
  };

  const inputCls =
    'w-full border border-border rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-pri bg-surf transition-colors';

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-surf border-b border-border h-14 flex items-center justify-between px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/${locale}`)}>
          <img src="/icon.svg" alt="Growpath" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-bold text-ink">Growpath</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 rounded-lg border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
          >
            {t('login')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/signup`)}
            className="px-4 py-2 rounded-lg bg-pri text-sm font-semibold text-on-pri hover:opacity-90 transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pri/10 border border-pri/20 text-pri text-xs font-semibold mb-4">
            <Sparkles size={12} strokeWidth={1.8} /> {t('badge')}
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">{t('title')}</h1>
          <p className="text-ink-faint text-sm">{t('sub')}</p>
        </div>

        {!stages ? (
          <div className="bg-surf border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="text-xs text-ink-faint mb-2 block font-medium">{t('goalLabel')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('goalPlaceholder')}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-ink-faint mb-2 block font-medium">{t('levelLabel')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('levelPlaceholder')}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') generate();
                  }}
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

            <button
              onClick={generate}
              disabled={loading || !goal.trim() || !level.trim()}
              className="w-full py-3 rounded-xl bg-pri hover:opacity-90 disabled:opacity-40 text-sm font-bold text-on-pri transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles size={14} strokeWidth={1.8} className="animate-spin" /> {t('generating')}
                </>
              ) : (
                <>
                  <Sparkles size={14} strokeWidth={1.8} /> {t('generateBtn')}
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-surf border border-border rounded-2xl p-6 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-ink">{goal}</h2>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {stages.length} stages · {level}
                  </p>
                </div>
                <button onClick={() => setStages(null)} className="text-xs text-ink-faint hover:text-ink-dim transition-colors">
                  {t('retry')}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {stages.map((stage, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${i === stages.length - 1 ? 'bg-pri/10 border-pri/20' : 'bg-surf-2 border-border'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${i === stages.length - 1 ? 'bg-pri text-on-pri' : 'bg-surf text-ink-faint'}`}
                    >
                      {stage.level}
                    </div>
                    <div className="min-w-0">
                      <p className={`flex items-center gap-1 text-sm font-semibold ${i === stages.length - 1 ? 'text-pri' : 'text-ink'}`}>
                        {stage.title}
                        {i === stages.length - 1 && <Trophy size={13} strokeWidth={1.8} />}
                      </p>
                      <p className="text-xs text-ink-faint mt-0.5">{stage.description}</p>
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {stage.skills
                          .slice(0, 2)
                          .flatMap((sk) => sk.tags.slice(0, 3))
                          .map((tag, j) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 rounded-full bg-pri/10 text-pri">
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surf border border-pri/20 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-sm font-semibold text-ink mb-1">{t('saveTitle')}</p>
              <p className="text-xs text-ink-faint mb-4">{t('saveSub')}</p>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-pri hover:opacity-90 text-sm font-bold text-on-pri transition-colors mb-2"
              >
                <Sparkles size={14} strokeWidth={1.8} /> {t('saveBtn')}
              </button>
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-ink-dim hover:bg-surf-2 transition-colors"
              >
                {t('loginBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
