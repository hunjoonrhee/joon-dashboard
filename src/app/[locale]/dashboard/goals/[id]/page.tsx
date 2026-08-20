'use client';

import { getSkillSource } from '@/lib/gapAnalysis';
import { goalStatusStyle, priorityStyle } from '@/lib/statusConfig';
import { getCurrentUserId, supabase } from '@/lib/supabase';
import type { AiRoadmap, Goal, Topic } from '@/types';
import { ArrowLeft, Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GoalDetail() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations('goals');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tPriority = useTranslations('priority');

  const [goal, setGoal] = useState<Goal | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({
    name: '',
    description: '',
    status: 'in_progress' as Goal['status'],
    priority: 'medium' as Goal['priority'],
    is_focus: false,
  });

  // Evidence-based completion suggestions: a topic auto-generated from a
  // roadmap skill (name matches 1:1) gets flagged when the same tag-overlap
  // evidence gapPct already trusts (cert/project skill tags, or study-log
  // tags) covers it - suggestion only, the checkbox is still the only thing
  // that actually marks it done.
  const [suggestedTopicNames, setSuggestedTopicNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: g }, { data: tp }] = await Promise.all([
        supabase.from('goals').select('*').eq('id', id).single(),
        supabase.from('topics').select('*').eq('goal_id', id).order('created_at'),
      ]);
      if (g) {
        setGoal(g);
        setInfoDraft({
          name: g.name,
          description: g.description ?? '',
          status: g.status,
          priority: g.priority,
          is_focus: g.is_focus,
        });
      }
      if (tp) setTopics(tp);
      setLoading(false);

      if (g?.roadmap_id && g.stage_level !== null) {
        const [{ data: roadmap }, { data: sessions }, { data: certs }, { data: projectSkills }] = await Promise.all([
          supabase.from('ai_roadmaps').select('stages').eq('id', g.roadmap_id).single(),
          supabase.from('sessions').select('tags'),
          supabase.from('certifications').select('tags'),
          supabase.from('project_skills').select('tags'),
        ]);
        const stage = (roadmap as Pick<AiRoadmap, 'stages'> | null)?.stages.find((s) => s.level === g.stage_level);
        if (stage) {
          // Deliberately NOT including g.tags here - the auto-generated stage
          // goal's own tags are just a copy of this same stage's skill tags
          // (set at adoption time), so including them would make every skill
          // trivially "match itself" regardless of any real study evidence.
          const studiedTags = new Set<string>((sessions ?? []).flatMap((s: { tags: string[] }) => s.tags));
          const certTags = new Set<string>((certs ?? []).flatMap((c: { tags: string[] }) => c.tags));
          const practicalTags = new Set<string>((projectSkills ?? []).flatMap((ps: { tags: string[] }) => ps.tags));

          const suggested = new Set<string>();
          for (const skill of stage.skills) {
            const { source } = getSkillSource(skill.tags, studiedTags, certTags, practicalTags);
            if (source !== 'none') suggested.add(skill.name);
          }
          setSuggestedTopicNames(suggested);
        }
      }
    };
    fetchData();
  }, [id]);

  const saveInfo = async () => {
    if (!goal) return;
    setSaving(true);
    if (infoDraft.is_focus) {
      await supabase.from('goals').update({ is_focus: false }).neq('id', goal.id);
    }
    await supabase.from('goals').update(infoDraft).eq('id', goal.id);
    setGoal({ ...goal, ...infoDraft });
    setSaving(false);
    setEditingInfo(false);
  };

  const cancelInfo = () => {
    setInfoDraft({
      name: goal?.name ?? '',
      description: goal?.description ?? '',
      status: goal?.status ?? 'in_progress',
      priority: goal?.priority ?? 'medium',
      is_focus: goal?.is_focus ?? false,
    });
    setEditingInfo(false);
  };

  const addTopic = async () => {
    if (!newTopic.trim() || !goal) return;
    setSaving(true);
    const userId = await getCurrentUserId();
    const { data } = await supabase
      .from('topics')
      .insert({
        name: newTopic.trim(),
        category: newCategory.trim() || 'general',
        goal_id: goal.id,
        completed: false,
        user_id: userId,
      })
      .select()
      .single();
    if (data) setTopics((prev) => [...prev, data]);
    setNewTopic('');
    setNewCategory('');
    setAddingTopic(false);
    setSaving(false);
  };

  const toggleTopic = async (topic: Topic) => {
    await supabase.from('topics').update({ completed: !topic.completed }).eq('id', topic.id);
    setTopics((prev) => prev.map((tp) => (tp.id === topic.id ? { ...tp, completed: !tp.completed } : tp)));
  };

  const removeTopic = async (topic: Topic) => {
    await supabase.from('topics').delete().eq('id', topic.id);
    setTopics((prev) => prev.filter((tp) => tp.id !== topic.id));
  };

  const categories = [...new Set(topics.map((tp) => tp.category))];

  const getPct = (cat: string) => {
    const filtered = topics.filter((tp) => tp.category === cat);
    if (filtered.length === 0) return 0;
    return Math.round((filtered.filter((tp) => tp.completed).length / filtered.length) * 100);
  };

  const totalPct =
    topics.length === 0 ? 0 : Math.round((topics.filter((tp) => tp.completed).length / topics.length) * 100);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm">{tCommon('loadingDots')}</p>
      </main>
    );

  if (!goal)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm">{t('empty')}</p>
      </main>
    );

  return (
    <main className="mx-auto px-4 py-4 max-w-6xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-ink-faint hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{tCommon('cancel')}</span>
      </button>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <div className="bg-surf rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-dim">{t('editModal')}</p>
            {!editingInfo ? (
              <button onClick={() => setEditingInfo(true)} className="text-ink-faint hover:text-pri transition-colors">
                <Pencil size={15} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelInfo} className="text-ink-faint hover:text-ink-dim transition-colors">
                  <X size={15} />
                </button>
                <button
                  onClick={saveInfo}
                  disabled={saving}
                  className="text-pri hover:opacity-80 transition-colors disabled:opacity-50"
                >
                  <Check size={15} />
                </button>
              </div>
            )}
          </div>

          {editingInfo ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-ink-faint mb-1 block">{t('name')}</label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                  value={infoDraft.name}
                  onChange={(e) => setInfoDraft({ ...infoDraft, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-ink-faint mb-1 block">{t('description')}</label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                  value={infoDraft.description}
                  onChange={(e) => setInfoDraft({ ...infoDraft, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-ink-faint mb-1 block">{t('priority')}</label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                    value={infoDraft.priority}
                    onChange={(e) =>
                      setInfoDraft({
                        ...infoDraft,
                        priority: e.target.value as Goal['priority'],
                      })
                    }
                  >
                    <option value="urgent">{tPriority('urgent')}</option>
                    <option value="high">{tPriority('high')}</option>
                    <option value="medium">{tPriority('medium')}</option>
                    <option value="low">{tPriority('low')}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-ink-faint mb-1 block">{t('status')}</label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                    value={infoDraft.status}
                    onChange={(e) =>
                      setInfoDraft({
                        ...infoDraft,
                        status: e.target.value as Goal['status'],
                      })
                    }
                  >
                    <option value="in_progress">{tStatus('in_progress')}</option>
                    <option value="completed">{tStatus('completed')}</option>
                    <option value="planned">{tStatus('planned')}</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_focus"
                  checked={infoDraft.is_focus}
                  onChange={(e) => setInfoDraft({ ...infoDraft, is_focus: e.target.checked })}
                />
                <label htmlFor="is_focus" className="text-sm text-ink-dim">
                  {t('focus')}
                </label>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-ink">{goal.name}</h1>
                {goal.description && <p className="text-sm text-ink-faint mt-1">{goal.description}</p>}
                {goal.is_focus && <p className="text-xs text-pri mt-2 font-medium">★ {t('focus')}</p>}
                {/* 전체 진행도 */}
                {topics.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-ink-faint mb-1">
                      <span>{totalPct}%</span>
                      <span>
                        {topics.filter((tp) => tp.completed).length}/{topics.length}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surf-2 rounded-full overflow-hidden">
                      <div className="h-full bg-pri rounded-full transition-all" style={{ width: `${totalPct}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyle[goal.priority]}`}>
                  {tPriority(goal.priority)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${goalStatusStyle[goal.status]}`}>
                  {tStatus(goal.status)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 체크리스트 */}
        <div className="bg-surf rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-dim">{t('checklist')}</p>
            <button onClick={() => setAddingTopic(true)} className="text-pri hover:opacity-80 transition-colors">
              <Plus size={18} />
            </button>
          </div>

          {addingTopic && (
            <div className="flex flex-col gap-2 mb-4 p-3 bg-surf-2 rounded-lg">
              <input
                type="text"
                autoFocus
                className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-pri bg-surf text-ink"
                placeholder={t('checklistPlaceholder')}
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTopic();
                }}
              />
              <input
                type="text"
                className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-pri bg-surf text-ink"
                placeholder={t('checklistCategory')}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAddingTopic(false)} className="text-ink-faint hover:text-ink-dim">
                  <X size={16} />
                </button>
                <button onClick={addTopic} disabled={saving} className="text-pri hover:opacity-80 disabled:opacity-50">
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}

          {topics.length === 0 && !addingTopic ? (
            <div className="text-center py-6">
              <p className="text-sm text-ink-faint leading-relaxed">{t('checklistEmpty')}</p>
              <button
                onClick={() => setAddingTopic(true)}
                className="mt-3 text-xs text-pri hover:opacity-80 font-medium transition-colors"
              >
                + {t('checklistPlaceholder')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.map((cat) => {
                const pct = getPct(cat);
                const catTopics = topics.filter((tp) => tp.category === cat);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-ink-dim mb-1">
                      <span className="font-medium">{cat}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surf-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-pri rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {catTopics.map((tp) => {
                        const isSuggested = !tp.completed && suggestedTopicNames.has(tp.name);
                        return (
                          <div key={tp.id} className="flex flex-col group">
                            <div className="flex items-center justify-between">
                              <div
                                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                onClick={() => toggleTopic(tp)}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    tp.completed
                                      ? 'bg-pri border-pri'
                                      : isSuggested
                                        ? 'border-amber'
                                        : 'border-border hover:border-pri/50'
                                  }`}
                                >
                                  {tp.completed && <Check size={11} className="text-on-pri" strokeWidth={3} />}
                                </div>
                                <span
                                  className={`text-sm truncate ${tp.completed ? 'line-through text-ink-faint' : 'text-ink-dim'}`}
                                >
                                  {tp.name}
                                </span>
                              </div>
                              <button
                                onClick={() => removeTopic(tp)}
                                className="text-ink-faint hover:text-red-400 transition-colors ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            {isSuggested && (
                              <div className="flex items-center gap-1 ml-6 mt-0.5" title={t('checklistSuggestedHint')}>
                                <Sparkles size={11} className="text-amber flex-shrink-0" />
                                <span className="text-xs text-amber">{t('checklistSuggested')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
