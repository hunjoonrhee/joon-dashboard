'use client';

import ThemeModeSelector from '@/components/settings/ThemeModeSelector';
import { useToast } from '@/components/Toast';
import { useUser } from '@/components/UserProvider';
import { cardCls, inputCls, labelCls } from '@/lib/styles';
import { supabase, upsertWithUser } from '@/lib/supabase';
import { useSubscription } from '@/lib/subscription';
import type { Certification, Setting } from '@/types';
import { ArrowLeft, Check, Crown, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LOCALES = [
  { value: 'ko', label: '한국어' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations('settings');
  const { show } = useToast();
  const user = useUser();
  const { subscription } = useSubscription(user?.id);
  const [billingLoading, setBillingLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    big_goal: '',
    big_goal_sub: '',
    bio: '',
    monthly_session_target: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [certs, setCerts] = useState<Certification[]>([]);
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    tags: '',
    issued_at: '',
  });
  const [addingCert, setAddingCert] = useState(false);
  const [savingCert, setSavingCert] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [settingsRes, certsRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('certifications').select('*').order('created_at', { ascending: false }),
      ]);
      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: Setting) => {
          map[s.key] = s.value;
        });
        setForm({
          name: map.name ?? '',
          big_goal: map.big_goal ?? '',
          big_goal_sub: map.big_goal_sub ?? '',
          bio: map.bio ?? '',
          monthly_session_target: map.monthly_session_target ?? '',
        });
      }
      if (certsRes.data) setCerts(certsRes.data as Certification[]);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await Promise.all(
      Object.entries(form).map(([key, value]) =>
        upsertWithUser('settings', { key, value }, { onConflict: 'key,user_id' })
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveCert = async () => {
    if (!certForm.name.trim()) return;
    setSavingCert(true);
    const tags = certForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const { data, error } = await supabase
      .from('certifications')

      .select()
      .single();
    setSavingCert(false);
    if (error) {
      show(t('certSaveFailed'), { type: 'error' });
      return;
    }
    setCerts((prev) => [data as Certification, ...prev]);
    setCertForm({ name: '', issuer: '', tags: '', issued_at: '' });
    setAddingCert(false);
    show(t('certAdded'), { type: 'success' });
  };

  const deleteCert = async (id: string) => {
    await supabase.from('certifications').delete().eq('id', id);
    setCerts((prev) => prev.filter((c) => c.id !== id));
    show(t('certDeleted'), { type: 'info' });
  };

  const hasPaidSubscription =
    subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';
  const trialDaysLeft =
    !hasPaidSubscription && subscription?.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / 86400000))
      : 0;

  const handleBilling = async () => {
    setBillingLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const endpoint = hasPaidSubscription ? '/api/billing/portal' : '/api/billing/checkout';
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ locale: currentLocale }) });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setBillingLoading(false);
    }
  };

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  };

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/${currentLocale}`)}
        className="flex items-center gap-1.5 text-ink-dim hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{t('back')}</span>
      </button>

      <div className="flex flex-col gap-4">
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-pri" />
            <p className="text-sm font-medium text-ink">{t('proSectionTitle')}</p>
          </div>
          <p className="text-sm text-ink-dim mb-4">
            {hasPaidSubscription
              ? t('proActiveStatus')
              : trialDaysLeft > 0
                ? t('proTrialStatus', { days: trialDaysLeft })
                : t('proFreeStatus')}
          </p>
          <button
            onClick={handleBilling}
            disabled={billingLoading}
            className="w-full py-2.5 rounded-xl bg-pri text-on-pri text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {billingLoading ? t('proRedirecting') : hasPaidSubscription ? t('manageBilling') : t('upgradeToProBtn')}
          </button>
        </div>

        <div className={cardCls}>
          <p className="text-sm font-medium text-ink mb-4">{t('basicSettings')}</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>{t('name')}</label>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('bigGoal')}</label>
              <input
                type="text"
                className={inputCls}
                placeholder={t('bigGoalPlaceholder')}
                value={form.big_goal}
                onChange={(e) => setForm({ ...form, big_goal: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('bigGoalSub')}</label>
              <input
                type="text"
                className={inputCls}
                placeholder={t('bigGoalSubPlaceholder')}
                value={form.big_goal_sub}
                onChange={(e) => setForm({ ...form, big_goal_sub: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>{t('bio')}</label>
              <p className="text-xs text-ink-faint mb-1">{t('bioHint')}</p>
              <textarea
                className={`${inputCls} min-h-[90px] resize-none`}
                placeholder={t('bioPlaceholder')}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={600}
              />
            </div>
            <div>
              <label className={labelCls}>{t('monthlyTarget')}</label>
              <input
                type="number"
                className={inputCls}
                value={form.monthly_session_target}
                onChange={(e) => setForm({ ...form, monthly_session_target: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink">{t('certifications')}</p>
            <button
              onClick={() => setAddingCert((v) => !v)}
              className="text-xs text-pri hover:opacity-80 font-medium transition-colors"
            >
              {addingCert ? t('cancel') : `+ ${t('addCert')}`}
            </button>
          </div>

          {addingCert && (
            <div className="flex flex-col gap-2 mb-4 p-3 bg-surf-2 rounded-lg border border-border">
              <div>
                <label className={labelCls}>{t('certName')} *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certNamePlaceholder')}
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>{t('certIssuer')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certIssuerPlaceholder')}
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>{t('certTags')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certTagsPlaceholder')}
                  value={certForm.tags}
                  onChange={(e) => setCertForm({ ...certForm, tags: e.target.value })}
                />
                <p className="text-xs text-ink-faint mt-1">{t('certTagsNote')}</p>
              </div>
              <div>
                <label className={labelCls}>{t('certDate')}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={certForm.issued_at}
                  onChange={(e) => setCertForm({ ...certForm, issued_at: e.target.value })}
                />
              </div>
              <button
                onClick={saveCert}
                disabled={savingCert || !certForm.name.trim()}
                className="w-full py-2 rounded-lg bg-pri text-on-pri text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {savingCert ? t('saving') : t('saveCert')}
              </button>
            </div>
          )}

          {certs.length === 0 ? (
            <p className="text-sm text-ink-faint text-center py-3">{t('noCerts')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {certs.map((cert) => (
                <div key={cert.id} className="flex items-start gap-3 p-3 bg-surf-2 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-ink truncate">{cert.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 flex-shrink-0">
                        {t('verified')}
                      </span>
                    </div>
                    {cert.issuer && <p className="text-xs text-ink-faint mb-1">{cert.issuer}</p>}
                    {cert.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cert.tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-surf text-pri">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCert(cert.id)}
                    className="text-ink-faint hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardCls}>
          <p className="text-sm font-medium text-ink mb-3">{t('language')}</p>
          <div className="flex gap-2">
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                onClick={() => switchLocale(loc.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currentLocale === loc.value
                    ? 'bg-pri text-on-pri border-pri'
                    : 'bg-surf text-ink-dim border-border hover:border-pri hover:text-pri'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <p className="text-sm font-medium text-ink mb-3">{t('appearance')}</p>
          <ThemeModeSelector />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-pri text-on-pri rounded-xl py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {saved ? (
            <>
              <Check size={16} />
              {t('saved')}
            </>
          ) : saving ? (
            t('saving')
          ) : (
            t('save')
          )}
        </button>
      </div>
    </main>
  );
}
