'use client';

import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { cancelBtnCls, saveBtnCls } from '@/lib/styles';
import { supabase } from '@/lib/supabase';
import { upsertWithUser } from '@/lib/supabase';
import type { AiRoadmap } from '@/types';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjectSkillModal({ projectId, projectName, onClose, onSaved }: Props) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const { show } = useToast();
  const [tagPool, setTagPool] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: setting }, { data: existing }] = await Promise.all([
        supabase.from('settings').select('value').eq('key', 'adopted_roadmap_id').single(),
        supabase.from('project_skills').select('tags').eq('project_id', projectId).maybeSingle(),
      ]);
      if (existing?.tags) setSelected(existing.tags);

      if (!setting?.value) return;
      const { data: roadmap } = await supabase.from('ai_roadmaps').select('stages').eq('id', setting.value).single();
      if (!roadmap?.stages) return;
      const tags = [
        ...new Set(roadmap.stages.flatMap((s: AiRoadmap['stages'][number]) => s.skills.flatMap((sk) => sk.tags))),
      ] as string[];
      setTagPool(tags.sort());
    };
    load();
  }, [projectId]);

  const toggle = (tag: string) => {
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    setSelected((prev) => [...prev, trimmed]);
    setCustomInput('');
  };

  const save = async () => {
    if (selected.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const { error } = await upsertWithUser(
        'project_skills',
        { project_id: projectId, tags: selected },
        { onConflict: 'project_id' }
      );
      if (error) throw error;
      show(t('skillsSaved'), { type: 'success' });
      onSaved();
      onClose();
    } catch {
      show(t('skillsSaveFailed'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('skillModalTitle')} onClose={onClose}>
      <p className="text-xs text-ink-faint -mt-1 mb-4">
        {projectName} — {t('skillModalSub')}
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pri text-on-pri"
            >
              {tag}
              <button onClick={() => toggle(tag)} className="hover:opacity-70">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {tagPool.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-ink-faint mb-2">{t('roadmapTags')}</p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {tagPool.map((tag) => (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selected.includes(tag)
                    ? 'bg-pri text-on-pri border-pri'
                    : 'bg-surf text-ink-faint border-border hover:border-pri/40 hover:text-pri'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={t('customTagPlaceholder')}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
        />
        <button
          onClick={addCustom}
          className="px-3 py-2 rounded-lg border border-border text-sm text-ink-faint hover:border-pri/40 hover:text-pri transition-colors"
        >
          +
        </button>
      </div>
      <p className="text-xs text-ink-faint mb-4">{t('skillModalNote')}</p>

      <div className="flex justify-between pt-1">
        <button onClick={onClose} className="text-xs text-ink-faint hover:text-ink-dim">
          {t('skipForNow')}
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className={cancelBtnCls}>
            {tCommon('cancel')}
          </button>
          <button onClick={save} disabled={saving} className={saveBtnCls}>
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
