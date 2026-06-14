'use client';

import TilEditor from '@/components/TilEditor';
import { supabase } from '@/lib/supabase';
import { getTagColor } from '@/lib/tagColor';
import type { Session } from '@/types';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TilPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('til');
  const id = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [til, setTil] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }: { data: Session | null }) => {
        if (data) {
          setSession(data as Session);
          setTil(data.til ?? '');
        }
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    if (!session) return;
    setSaving(true);
    await supabase
      .from('sessions')
      .update({ til: til.trim() || null })
      .eq('id', id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push(`/sessions/${id}`);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400">{t('notFound')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 py-6">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/study')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          <ArrowLeft size={15} />
          {t('back')}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : null}
          {saved ? t('saved') : saving ? t('saving') : t('save')}
        </button>
      </div>

      {/* 세션 정보 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          {session.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{session.date}</span>
          {session.duration_minutes && (
            <span className="text-xs text-gray-400">
              · {session.duration_minutes}
              {t('minutes')}
            </span>
          )}
          {session.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* TIL 에디터 */}
      <TilEditor
        value={til}
        onChange={setTil}
        minHeight="calc(100vh - 220px)"
      />

      {/* 저장 단축키 안내 */}
      <p className="text-xs text-gray-300 mt-2 text-right">{t('saveHint')}</p>
    </div>
  );
}
