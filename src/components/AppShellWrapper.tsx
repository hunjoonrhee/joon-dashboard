'use client'

import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

export default function AppShellWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname.endsWith('/login')

  if (isLoginPage) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}
