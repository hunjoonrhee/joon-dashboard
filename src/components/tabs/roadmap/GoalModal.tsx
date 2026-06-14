'use client';

import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { cancelBtnCls, inputCls, labelCls, saveBtnCls } from '@/lib/styles';
import { insertWithUser, supabase } from '@/lib/supabase';
import type { AiRoadmap, Goal } from '@/types';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Preset {
  name?: string;
  description?: string;
  tags?: string[];
}

interface Props {
  mode: 'add' | 'edit';
  goal?: Goal;
  preset?: Preset;
  tagPool?: string[];
  adoptedRoadmap?: AiRoadmap | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GoalModal({
  mode,
  goal,
  preset,
  tagPool: tagPoolProp,
  adoptedRoadmap,
  onClose,
  onSaved,
}: Props) {
  const t = useTranslations('goals');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tPriority = useTranslations('priority');
  const tToast = useTranslations('toast');
  const { show } = useToast();

  const [form, setForm] = useState({
    name: goal?.name ?? preset?.name ?? '',
    description: goal?.description ?? preset?.description ?? '',
    status: (goal?.status ?? 'in_progress') as Goal['status'],
    priority: (goal?.priority ?? 'medium') as Goal['priority'],
    is_focus: goal?.is_focus ?? false,
    tags: goal?.tags ?? preset?.tags ?? ([] as string[]),
    stage_level: goal?.stage_level ?? (null as number | null),
  });
  const [saving, setSaving] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const tagPool = tagPoolProp ?? preset?.tags ?? [];

  const filteredTags = tagSearch.trim()
    ? tagPool.filter(
        (tag) =>
          tag.toLowerCase().includes(tagSearch.toLowerCase()) &&
          !form.tags.includes(tag)
      )
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || form.tags.includes(trimmed)) return;
    setForm({ ...form, tags: [...form.tags, trimmed] });
    setTagSearch('');
    setTagDropdownOpen(false);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      is_focus: form.is_focus,
      tags: form.tags,
      stage_level: form.stage_level,
      roadmap_id: form.stage_level && adoptedRoadmap ? adoptedRoadmap.id : null,
    };
    try {
      if (form.is_focus)
        await supabase
          .from('goals')
          .update({ is_focus: false })
          .neq('id', goal?.id ?? '');
      if (mode === 'add') await insertWithUser('goals', payload);
      else if (goal)
        await supabase.from('goals').update(payload).eq('id', goal.id);
      show(mode === 'add' ? tToast('goalAdded') : tToast('goalEdited'), {
        type: 'success',
      });
      onSaved();
      onClose();
    } catch {
      show(tToast('saveFailed'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!goal) return;
    try {
      await supabase.from('goals').delete().eq('id', goal.id);
      show(tToast('goalDeleted'), { type: 'info' });
      onSaved();
      onClose();
    } catch {
      show(tToast('deleteFailed'), { type: 'error' });
    }
  };

  return (
    <Modal
      title={mode === 'add' ? t('addModal') : t('editModal')}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>{t('name')}</label>
          <input
            autoFocus
            type="text"
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
          />
        </div>
        <div>
          <label className={labelCls}>{t('description')}</label>
          <input
            type="text"
            className={inputCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>{t('priority')}</label>
            <select
              className={inputCls}
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
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
            <label className={labelCls}>{t('status')}</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Goal['status'] })
              }
            >
              <option value="in_progress">{tStatus('in_progress')}</option>
              <option value="completed">{tStatus('completed')}</option>
              <option value="planned">{tStatus('planned')}</option>
            </select>
          </div>
        </div>

        {/* 로드맵 단계 연결 — 채택된 로드맵 있을 때만 표시 */}
        {adoptedRoadmap && (
          <div>
            <label className={labelCls}>{t('stageLink')}</label>
            <select
              className={inputCls}
              value={form.stage_level ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  stage_level: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">{t('stageLinkNone')}</option>
              {adoptedRoadmap.stages.map((s) => (
                <option key={s.level} value={s.level}>
                  {s.level}단계 — {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>{t('tags')}</label>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => {
                const isCustom = !tagPool.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isCustom
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {tag}
                    {isCustom && (
                      <span className="text-gray-400 text-xs">*</span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          tags: form.tags.filter((t) => t !== tag),
                        })
                      }
                      className="hover:opacity-70"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              className={inputCls}
              placeholder={tCommon('tagSearchPlaceholder')}
              value={tagSearch}
              onChange={(e) => {
                setTagSearch(e.target.value);
                setTagDropdownOpen(true);
              }}
              onFocus={() => setTagDropdownOpen(true)}
              onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagSearch.trim()) {
                  e.preventDefault();
                  addTag(tagSearch);
                }
              }}
            />
            {tagDropdownOpen && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {filteredTags.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto">
                    {filteredTags.slice(0, 20).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={() => addTag(tag)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : tagSearch.trim() &&
                  !form.tags.includes(tagSearch.trim()) ? (
                  <button
                    type="button"
                    onMouseDown={() => addTag(tagSearch)}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-400">
                      {tCommon('tagCustomAdd')}:{' '}
                    </span>
                    <span className="font-medium text-gray-700">
                      {tagSearch.trim()}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {tCommon('tagGapNote')}
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_focus"
            checked={form.is_focus}
            onChange={(e) => setForm({ ...form, is_focus: e.target.checked })}
          />
          <label htmlFor="is_focus" className="text-sm text-gray-600">
            {t('focus')}
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-1">
        {mode === 'edit' ? (
          <button
            onClick={remove}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        ) : (
          <div />
        )}
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
