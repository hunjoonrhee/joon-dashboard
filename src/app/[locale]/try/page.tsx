'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RoadmapStage {
  level: number
  title: string
  description: string
  skills: { name: string; tags: string[] }[]
}

export default function TryPage() {
  const locale = useLocale()
  const t = useTranslations('try')
  const router = useRouter()

  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('')
  const [stages, setStages] = useState<RoadmapStage[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!goal.trim() || !level.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), careerLevel: level.trim(), locale }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStages(data.stages ?? [])
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!stages) return
    const goalTrimmed = goal.trim()
    const levelTrimmed = level.trim()

    // sessionStorage — 같은 탭에서 돌아올 때
    sessionStorage.setItem('ob_goal', goalTrimmed)
    sessionStorage.setItem('ob_level', levelTrimmed)
    sessionStorage.setItem('ob_stages', JSON.stringify(stages))

    // URL 파라미터 — 새 탭/모바일 메일 앱에서 인증 링크 클릭 시 복구용
    const params = new URLSearchParams({
      goal: goalTrimmed,
      level: levelTrimmed,
    })
    router.push(`/${locale}/signup?${params.toString()}`)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 bg-white transition-colors'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/${locale}`)}>
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">🧭</div>
          <span className="text-sm font-bold text-gray-800">Growpath</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            {t('login')}
          </button>
          <button onClick={() => router.push(`/${locale}/signup`)}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors">
            {t('start')}
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 text-xs font-semibold mb-4">
            ✦ {t('badge')}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-500 text-sm">{t('sub')}</p>
        </div>

        {!stages ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">{t('goalLabel')}</label>
                <input type="text" className={inputCls}
                  placeholder={t('goalPlaceholder')}
                  value={goal} onChange={(e) => setGoal(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">{t('levelLabel')}</label>
                <input type="text" className={inputCls}
                  placeholder={t('levelPlaceholder')}
                  value={level} onChange={(e) => setLevel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') generate() }} />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button onClick={generate} disabled={loading || !goal.trim() || !level.trim()}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><span className="animate-spin inline-block">✦</span> {t('generating')}</>
              ) : (
                <>✦ {t('generateBtn')}</>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{goal}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{stages.length} stages · {level}</p>
                </div>
                <button onClick={() => setStages(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  {t('retry')}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {stages.map((stage, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${i === stages.length - 1 ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${i === stages.length - 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {stage.level}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${i === stages.length - 1 ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {stage.title} {i === stages.length - 1 && '🏆'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{stage.description}</p>
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {stage.skills.slice(0, 2).flatMap(sk => sk.tags.slice(0, 3)).map((tag, j) => (
                          <span key={j} className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-sm font-semibold text-gray-800 mb-1">{t('saveTitle')}</p>
              <p className="text-xs text-gray-400 mb-4">{t('saveSub')}</p>
              <button onClick={handleSave}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-sm font-bold text-white transition-colors mb-2">
                ✦ {t('saveBtn')}
              </button>
              <button onClick={() => router.push(`/${locale}/login`)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                {t('loginBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
