'use client'

import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { Certification, Setting } from '@/types'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const LOCALES = [
  { value: 'ko', label: '한국어' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
]

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const t = useTranslations('settings')
  const { show } = useToast()

  const [form, setForm] = useState({
    name: '',
    big_goal: '',
    big_goal_sub: '',
    monthly_session_target: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [certs, setCerts] = useState<Certification[]>([])
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    tags: '',
    issued_at: '',
  })
  const [addingCert, setAddingCert] = useState(false)
  const [savingCert, setSavingCert] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [settingsRes, certsRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase
          .from('certifications')
          .select('*')
          .order('created_at', { ascending: false }),
      ])
      if (settingsRes.data) {
        const map: Record<string, string> = {}
        settingsRes.data.forEach((s: Setting) => {
          map[s.key] = s.value
        })
        setForm({
          name: map.name ?? '',
          big_goal: map.big_goal ?? '',
          big_goal_sub: map.big_goal_sub ?? '',
          monthly_session_target: map.monthly_session_target ?? '',
        })
      }
      if (certsRes.data) setCerts(certsRes.data as Certification[])
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    await Promise.all(
      Object.entries(form).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveCert = async () => {
    if (!certForm.name.trim()) return
    setSavingCert(true)
    const tags = certForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const { data, error } = await supabase
      .from('certifications')
      .insert({
        name: certForm.name.trim(),
        issuer: certForm.issuer.trim() || null,
        tags,
        issued_at: certForm.issued_at || null,
      })
      .select()
      .single()
    setSavingCert(false)
    if (error) {
      show(t('certSaveFailed'), { type: 'error' })
      return
    }
    setCerts((prev) => [data as Certification, ...prev])
    setCertForm({ name: '', issuer: '', tags: '', issued_at: '' })
    setAddingCert(false)
    show(t('certAdded'), { type: 'success' })
  }

  const deleteCert = async (id: string) => {
    await supabase.from('certifications').delete().eq('id', id)
    setCerts((prev) => prev.filter((c) => c.id !== id))
    show(t('certDeleted'), { type: 'info' })
  }

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/')
    segments[1] = locale
    router.push(segments.join('/'))
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400'
  const labelCls = 'text-xs text-gray-500 mb-1 block'

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.push(`/${currentLocale}`)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">{t('back')}</span>
      </button>

      <div className="flex flex-col gap-4">
        {/* 기본 설정 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-4">
            {t('basicSettings')}
          </p>
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
                onChange={(e) =>
                  setForm({ ...form, big_goal_sub: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>{t('monthlyTarget')}</label>
              <input
                type="number"
                className={inputCls}
                value={form.monthly_session_target}
                onChange={(e) =>
                  setForm({ ...form, monthly_session_target: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* 자격증 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {t('certifications')}
            </p>
            <button
              onClick={() => setAddingCert((v) => !v)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              {addingCert ? t('cancel') : `+ ${t('addCert')}`}
            </button>
          </div>

          {addingCert && (
            <div className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <label className={labelCls}>{t('certName')} *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certNamePlaceholder')}
                  value={certForm.name}
                  onChange={(e) =>
                    setCertForm({ ...certForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>{t('certIssuer')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certIssuerPlaceholder')}
                  value={certForm.issuer}
                  onChange={(e) =>
                    setCertForm({ ...certForm, issuer: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>{t('certTags')}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t('certTagsPlaceholder')}
                  value={certForm.tags}
                  onChange={(e) =>
                    setCertForm({ ...certForm, tags: e.target.value })
                  }
                />
                <p className="text-xs text-gray-300 mt-1">
                  {t('certTagsNote')}
                </p>
              </div>
              <div>
                <label className={labelCls}>{t('certDate')}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={certForm.issued_at}
                  onChange={(e) =>
                    setCertForm({ ...certForm, issued_at: e.target.value })
                  }
                />
              </div>
              <button
                onClick={saveCert}
                disabled={savingCert || !certForm.name.trim()}
                className="w-full py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                {savingCert ? t('saving') : t('saveCert')}
              </button>
            </div>
          )}

          {certs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              {t('noCerts')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {certs.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {cert.name}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 flex-shrink-0">
                        {t('verified')}
                      </span>
                    </div>
                    {cert.issuer && (
                      <p className="text-xs text-gray-400 mb-1">
                        {cert.issuer}
                      </p>
                    )}
                    {cert.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cert.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteCert(cert.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 언어 설정 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t('language')}
          </p>
          <div className="flex gap-2">
            {LOCALES.map((loc) => (
              <button
                key={loc.value}
                onClick={() => switchLocale(loc.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currentLocale === loc.value
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
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
  )
}
