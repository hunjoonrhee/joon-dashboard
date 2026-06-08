import NavBar from '@/components/NavBar'
import Sidebar from '@/components/Sidebar'
import { routing } from '@/i18n/routing'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

type Locale = (typeof routing.locales)[number]

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </div>
    </NextIntlClientProvider>
  )
}
