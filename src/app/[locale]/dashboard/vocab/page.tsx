'use client';

import { useToast } from '@/components/Toast';
import VocabCard from '@/components/vocab/VocabCard';
import VocabReviewActions from '@/components/vocab/VocabReviewActions';
import { useDueVocabWords, useVocabWords } from '@/lib/queries';
import { cardCls, inputCls, labelCls } from '@/lib/styles';
import { createVocabWord, deleteVocabWord, reviewVocabWord } from '@/lib/vocab';
import type { VocabWord } from '@/types';
import { ArrowLeft, BookMarked, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type Tab = 'list' | 'review';

export default function VocabPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('vocab');
  const { show } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('list');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['vocab_words'] });

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="flex items-center gap-1.5 text-ink-dim hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{t('back')}</span>
      </button>

      <div className="flex items-center gap-2 mb-4">
        <BookMarked size={18} className="text-pri" />
        <h1 className="text-lg font-bold text-ink">{t('title')}</h1>
      </div>

      <div className="flex gap-1 bg-surf-2 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === 'list' ? 'bg-surf text-ink shadow-sm' : 'text-ink-faint'}`}
        >
          {t('tabList')}
        </button>
        <button
          onClick={() => setTab('review')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === 'review' ? 'bg-surf text-ink shadow-sm' : 'text-ink-faint'}`}
        >
          {t('tabReview')}
        </button>
      </div>

      {tab === 'list' ? <VocabList onChange={refresh} onToast={show} /> : <VocabReview onChange={refresh} />}
    </main>
  );
}

function VocabList({
  onChange,
  onToast,
}: {
  onChange: () => void;
  onToast: (msg: string, opts?: { type?: 'success' | 'error' | 'info'; sub?: string }) => void;
}) {
  const t = useTranslations('vocab');
  const { data: words = [], isLoading } = useVocabWords();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ language: '', word: '', meaning: '', example_sentence: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.language.trim() || !form.word.trim() || !form.meaning.trim()) return;
    await createVocabWord({
      language: form.language.trim(),
      word: form.word.trim(),
      meaning: form.meaning.trim(),
      example_sentence: form.example_sentence.trim() || null,
    });
    setForm({ language: '', word: '', meaning: '', example_sentence: '' });
    setAdding(false);
    onChange();
    onToast(t('wordAdded'), { type: 'success' });
  };

  const handleDelete = async (id: string) => {
    await deleteVocabWord(id);
    onChange();
    onToast(t('wordDeleted'), { type: 'info' });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-ink">{t('addWord')}</p>
          <button onClick={() => setAdding((v) => !v)} className="text-xs text-pri hover:opacity-80 font-medium">
            {adding ? t('cancel') : `+ ${t('addWord')}`}
          </button>
        </div>

        {adding && (
          <div className="flex flex-col gap-2 mt-3">
            <div>
              <label className={labelCls}>{t('language')}</label>
              <input
                className={inputCls}
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder={t('languagePlaceholder')}
              />
            </div>
            <div>
              <label className={labelCls}>{t('word')}</label>
              <input
                className={inputCls}
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('meaning')}</label>
              <input
                className={inputCls}
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('exampleSentence')}</label>
              <input
                className={inputCls}
                value={form.example_sentence}
                onChange={(e) => setForm({ ...form, example_sentence: e.target.value })}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!form.language.trim() || !form.word.trim() || !form.meaning.trim()}
              className="mt-1 py-2 rounded-lg bg-pri text-on-pri text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {t('save')}
            </button>
          </div>
        )}
      </div>

      {!isLoading && words.length === 0 && <p className="text-sm text-ink-faint text-center py-8">{t('noWords')}</p>}

      <div className="flex flex-col gap-2">
        {words.map((w) => {
          const expanded = expandedId === w.id;
          return (
            <div key={w.id} className="bg-surf rounded-xl border border-border overflow-hidden">
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : w.id)}
              >
                {expanded ? (
                  <ChevronDown size={15} className="text-ink-faint flex-shrink-0" />
                ) : (
                  <ChevronRight size={15} className="text-ink-faint flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{w.word}</p>
                  <p className="text-xs text-ink-faint truncate">
                    {w.language} · {w.meaning}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(w.id);
                  }}
                  className="text-ink-faint hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {expanded && w.example_sentence && (
                <div className="px-3 pb-3 pt-0 border-t border-border">
                  <p className="text-xs text-ink-dim mt-2 leading-relaxed">{w.example_sentence}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VocabReview({ onChange }: { onChange: () => void }) {
  const t = useTranslations('vocab');
  const { data: dueWords = [], isLoading } = useDueVocabWords(20);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const current: VocabWord | undefined = dueWords[index];

  const handleReview = async (knew: boolean) => {
    if (!current || reviewing) return;
    setReviewing(true);
    await reviewVocabWord(current, knew);
    setReviewing(false);
    setFlipped(false);
    setIndex((i) => i + 1);
    onChange();
  };

  if (isLoading) return null;

  if (dueWords.length === 0) {
    return <p className="text-sm text-ink-faint text-center py-8">{t('noDueWords')}</p>;
  }

  if (!current) {
    return <p className="text-sm text-ink-dim text-center py-8">{t('reviewComplete')}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <p className="text-xs text-ink-faint">
        {index + 1} / {dueWords.length}
      </p>
      <VocabCard word={current} flipped={flipped} onFlip={() => setFlipped((v) => !v)} />
      {flipped && <VocabReviewActions onReview={handleReview} disabled={reviewing} />}
    </div>
  );
}
