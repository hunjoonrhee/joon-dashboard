'use client';

import { supabase } from '@/lib/supabase';
import { insertWithUser } from '@/lib/supabase';
import type { Goal, Topic } from '@/types';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';

interface Props {
  topics: Topic[];
  goals: Goal[];
  onRefresh?: () => void;
}

export default function FocusGoal({ topics, goals, onRefresh }: Props) {
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'theory' });
  const [saving, setSaving] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const focusGoals = goals.filter((g) => g.is_focus);
  const getTopics = (goalId: string) =>
    topics.filter((t) => t.goal_id === goalId);
  const getCategories = (goalId: string) => [
    ...new Set(getTopics(goalId).map((t) => t.category)),
  ];

  const getPct = (goalId: string, cat: string) => {
    const filtered = getTopics(goalId).filter((t) => t.category === cat);
    if (filtered.length === 0) return 0;
    return Math.round(
      (filtered.filter((t) => t.completed).length / filtered.length) * 100
    );
  };

  const toggleCat = (key: string) => {
    setOpenCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCatOpen = (key: string) => openCats[key] ?? false;

  const toggle = async (topic: Topic) => {
    await supabase
      .from('topics')
      .update({ completed: !topic.completed })
      .eq('id', topic.id);
    onRefresh?.();
  };

  const open = (type: 'add' | 'edit', goalId: string, topic?: Topic) => {
    setSelectedGoalId(goalId);
    if (type === 'edit' && topic) {
      setSelectedTopic(topic);
      setForm({ name: topic.name, category: topic.category });
    } else {
      setSelectedTopic(null);
      const cats = getCategories(goalId);
      setForm({ name: '', category: cats[0] ?? 'theory' });
    }
    setModal(type);
  };

  const close = () => {
    setModal(null);
    setSelectedTopic(null);
    setSelectedGoalId(null);
    setForm({ name: '', category: 'theory' });
  };

  const save = async () => {
    if (!selectedGoalId) return;
    setSaving(true);
    if (modal === 'add') {
      await supabase.from('topics').insert({
        name: form.name,
        category: form.category,
        goal_id: selectedGoalId,
        completed: false,
      });
    } else if (selectedTopic) {
      await supabase
        .from('topics')
        .update({ name: form.name, category: form.category })
        .eq('id', selectedTopic.id);
    }
    setSaving(false);
    close();
    onRefresh?.();
  };

  const remove = async () => {
    if (!selectedTopic) return;
    await supabase.from('topics').delete().eq('id', selectedTopic.id);
    close();
    onRefresh?.();
  };

  if (focusGoals.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-3">현재 집중 목표</p>

        <div className="flex flex-col gap-5">
          {focusGoals.map((focusGoal, idx) => {
            const categories = getCategories(focusGoal.id);
            return (
              <div key={focusGoal.id}>
                {idx > 0 && <div className="border-t border-gray-100 mb-5" />}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {focusGoal.name}
                  </p>
                  <button
                    onClick={() => open('add', focusGoal.id)}
                    className="text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {categories.length === 0 ? (
                  <p className="text-sm text-gray-400">항목이 없어요.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {categories.map((cat) => {
                      const pct = getPct(focusGoal.id, cat);
                      const catTopics = getTopics(focusGoal.id).filter(
                        (t) => t.category === cat
                      );
                      const catKey = `${focusGoal.id}-${cat}`;
                      const isOpen = isCatOpen(catKey);
                      return (
                        <div
                          key={cat}
                          className="border border-gray-100 rounded-lg overflow-hidden"
                        >
                          <button
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                            onClick={() => toggleCat(catKey)}
                          >
                            <div className="flex items-center gap-2">
                              {isOpen ? (
                                <ChevronDown
                                  size={13}
                                  className="text-gray-400"
                                />
                              ) : (
                                <ChevronRight
                                  size={13}
                                  className="text-gray-400"
                                />
                              )}
                              <span className="text-xs font-medium text-gray-600">
                                {cat}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                {pct}%
                              </span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="flex flex-col gap-1.5 p-3">
                              {catTopics.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between"
                                >
                                  <div
                                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                    onClick={() => toggle(t)}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${t.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}
                                    >
                                      {t.completed && (
                                        <span className="text-white text-xs">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-sm truncate ${t.completed ? 'line-through text-gray-300' : 'text-gray-700'}`}
                                    >
                                      {t.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      open('edit', focusGoal.id, t)
                                    }
                                    className="text-gray-400 hover:text-indigo-500 transition-colors ml-2 flex-shrink-0"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {focusGoal.description && (
                  <p className="text-xs text-orange-500 mt-2 font-medium">
                    {focusGoal.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? '항목 추가' : '항목 수정'}
          onClose={close}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                항목 이름
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: Marble Diagrams"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                카테고리
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="예: theory, coding, mock"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-between pt-1">
            {modal === 'edit' ? (
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
              <button
                onClick={close}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs bg-indigo-500 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
