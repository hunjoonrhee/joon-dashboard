'use client';

import { supabase } from '@/lib/supabase';
import { getTagColor } from '@/lib/tagColor';
import type { Session, StudyItem } from '@/types';
import { ArrowLeft, Check, Pencil, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function SessionDetail() {
  const t = useTranslations('study');
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tilDraft, setTilDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({
    title: '',
    date: '',
    duration_minutes: '',
    tags: '',
  });

  const dateLocale = locale === 'ko' ? 'ko-KR' : locale === 'de' ? 'de-DE' : 'en-US';

  useEffect(() => {
    const fetch = async () => {
      const [{ data: s }, { data: items }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('study_items').select('*').eq('session_id', id).order('created_at'),
      ]);
      if (s) {
        setSession(s);
        setTilDraft(s.til ?? '');
        setInfoDraft({
          title: s.title,
          date: s.date,
          duration_minutes: s.duration_minutes?.toString() ?? '',
          tags: s.tags.join(', '),
        });
      }
      if (items) setStudyItems(items);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const saveInfo = async () => {
    if (!session) return;
    setSaving(true);
    const payload = {
      title: infoDraft.title,
      date: infoDraft.date,
      duration_minutes: infoDraft.duration_minutes ? parseInt(infoDraft.duration_minutes) : null,
      tags: infoDraft.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    await supabase.from('sessions').update(payload).eq('id', session.id);
    setSession({ ...session, ...payload });
    setSaving(false);
    setEditingInfo(false);
  };

  const cancelInfo = () => {
    setInfoDraft({
      title: session?.title ?? '',
      date: session?.date ?? '',
      duration_minutes: session?.duration_minutes?.toString() ?? '',
      tags: session?.tags.join(', ') ?? '',
    });
    setEditingInfo(false);
  };

  const addKeyword = async () => {
    if (!newKeyword.trim() || !session) return;
    const { data } = await supabase
      .from('study_items')
      .insert({ session_id: session.id, keyword: newKeyword.trim() })
      .select()
      .single();
    if (data) setStudyItems((prev) => [...prev, data]);
    setNewKeyword('');
    setAddingKeyword(false);
  };

  const removeKeyword = async (item: StudyItem) => {
    await supabase.from('study_items').delete().eq('id', item.id);
    setStudyItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm">{t('loading')}</p>
      </main>
    );

  if (!session)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-faint text-sm">{t('notFound')}</p>
      </main>
    );

  return (
    <main className="mx-auto px-4 py-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-ink-faint hover:text-ink-dim mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{t('backToList')}</span>
      </button>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <div className="bg-surf rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-dim">{t('basicInfo')}</p>
            {!editingInfo ? (
              <button onClick={() => setEditingInfo(true)} className="text-ink-faint hover:text-pri transition-colors">
                <Pencil size={15} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelInfo} className="text-ink-faint hover:text-ink-dim transition-colors">
                  <X size={15} />
                </button>
                <button onClick={saveInfo} disabled={saving} className="text-pri hover:opacity-80 transition-colors disabled:opacity-50">
                  <Check size={15} />
                </button>
              </div>
            )}
          </div>
          {editingInfo ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-ink-faint mb-1 block">{t('name')}</label>
                <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                  value={infoDraft.title} onChange={(e) => setInfoDraft({ ...infoDraft, title: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-ink-faint mb-1 block">{t('date')}</label>
                  <input type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                    value={infoDraft.date} onChange={(e) => setInfoDraft({ ...infoDraft, date: e.target.value })} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-ink-faint mb-1 block">{t('duration')}</label>
                  <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                    value={infoDraft.duration_minutes} onChange={(e) => setInfoDraft({ ...infoDraft, duration_minutes: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-faint mb-1 block">{t('tags')}</label>
                <input type="text" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pri bg-surf text-ink"
                  value={infoDraft.tags} onChange={(e) => setInfoDraft({ ...infoDraft, tags: e.target.value })} />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-ink mb-2">{session.title}</h1>
              <div className="flex items-center gap-3 text-sm text-ink-faint">
                <span>{new Date(session.date).toLocaleDateString(dateLocale)}</span>
                {session.duration_minutes && <span>· {session.duration_minutes}{t('duration')}</span>}
              </div>
              {session.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {session.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}>{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 공부 항목 */}
        <div className="bg-surf rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-dim">{t('studyItems')}</p>
            <button onClick={() => setAddingKeyword(true)} className="text-pri hover:opacity-80 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          {addingKeyword && (
            <div className="flex gap-2 mb-3">
              <input type="text" autoFocus
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-pri bg-surf text-ink"
                placeholder={t('keywordPlaceholder')}
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addKeyword();
                  if (e.key === 'Escape') setAddingKeyword(false);
                }}
              />
              <button onClick={addKeyword} className="text-pri hover:opacity-80"><Check size={16} /></button>
              <button onClick={() => setAddingKeyword(false)} className="text-ink-faint hover:text-ink-dim"><X size={16} /></button>
            </div>
          )}
          {studyItems.length === 0 && !addingKeyword ? (
            <p className="text-sm text-ink-faint">{t('studyItemsEmpty')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {studyItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 bg-pri/10 text-pri text-xs px-2.5 py-1 rounded-full group">
                  <span>{item.keyword}</span>
                  <button onClick={() => removeKeyword(item)} className="text-pri/60 hover:text-pri transition-colors opacity-0 group-hover:opacity-100">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TIL */}
        <div className="bg-surf rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-dim">{t('tilSection')}</p>
            <button
              onClick={() => router.push(`/${locale}/dashboard/til/${id}`)}
              className="text-ink-faint hover:text-pri transition-colors"
            >
              <Pencil size={15} />
            </button>
          </div>
          {session.til ? (
            <div className="prose prose-sm max-w-none text-ink-dim">
              <ReactMarkdown>{session.til}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">{t('sessionNoTil')}</p>
          )}
        </div>
      </div>
    </main>
  );
}
