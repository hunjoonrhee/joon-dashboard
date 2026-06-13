'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Onboarding1() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('onboarding')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const stages = sessionStorage.getItem('ob_stages')
    if (stages) {
      router.replace(`/${locale}/onboarding/3`)
    }
  }, [])

  const domains = [
    { key: 'dev', icon: '💻', label: t('domain1Label'), sub: t('domain1Sub') },
    { key: 'lang', icon: '🌍', label: t('domain2Label'), sub: t('domain2Sub') },
    { key: 'music', icon: '🎹', label: t('domain3Label'), sub: t('domain3Sub') },
    { key: 'custom', icon: '✏️', label: t('domain4Label'), sub: t('domain4Sub') },
  ]

  const handleNext = () => {
    if (!selected) return
    sessionStorage.setItem('ob_domain', selected)
    router.push(`/${locale}/onboarding/2`)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-8 max-w-md w-full">
        <div className="flex gap-1.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-indigo-500" />
          <div className="flex-1 h-1 rounded-full bg-gray-700" />
          <div className="flex-1 h-1 rounded-full bg-gray-700" />
        </div>
        <p className="text-xs text-gray-500 mb-1">{t('step1of3')}</p>
        <h2 className="text-xl font-bold text-white mb-6">{t('step1Title')}</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {domains.map((d) => (
            <button key={d.key} onClick={() => setSelected(d.key)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected === d.key
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-gray-800 hover:border-white/20'
              }`}>
              <div className="text-2xl mb-2">{d.icon}</div>
              <div className="text-sm font-semibold text-white mb-0.5">{d.label}</div>
              <div className={`text-xs ${selected === d.key ? 'text-indigo-300' : 'text-gray-500'}`}>{d.sub}</div>
            </button>
          ))}
        </div>

        <button onClick={handleNext} disabled={!selected}
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-sm font-bold text-white transition-colors">
          {t('nextBtn')}
        </button>
      </div>
    </div>
  )
}
