import { ThemeProvider, themeInitScript } from '@/lib/theme-context';
import type { Metadata } from 'next';
import { Geist_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import './globals.css';

const plexSansKr = IBM_Plex_Sans_KR({
  variable: '--font-plex-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Growpath',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before hydration so the page never flashes the wrong scheme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${plexSansKr.variable} ${geistMono.variable} antialiased bg-bg`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
