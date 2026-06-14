'use client';

import { usePathname } from 'next/navigation';
import AppShell from './AppShell';
import UserProvider from './UserProvider';

const PUBLIC_PATTERNS = [
  /\/login$/,
  /\/signup/,
  /\/try/,
  /\/verify/,
  /\/onboarding/,
  /^\/(ko|de|en)$/,
];

export default function AppShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATTERNS.some((p) => p.test(pathname));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
