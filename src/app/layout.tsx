import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'

import { BottomPanel } from '@/components/ActionBar/ActionBar'
import { Root } from '@/components/Root/Root'
import { APPEARANCE_BOOT_SCRIPT } from '@/lib/appearance'
import Bootstrap from './bootstrap'
import { Navigation } from './navigation'
import '@fontsource-variable/onest'
import './globals.css'

export const metadata: Metadata = {
  title: 'Friday Poker',
  applicationName: 'Friday Poker',
  description: 'Учёт домашних покерных игр, сезонов и достижений',
  // Не индексировать: приложение только для своих
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  // Запуск с экрана «Домой» на iPhone — без адресной строки
  appleWebApp: { capable: true, title: 'Friday Poker', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" data-theme="felt" suppressHydrationWarning>
      <head>
        {/* Тема до первой отрисовки, чтобы не мигала светлая */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body>
        <Root>
          <Bootstrap />
          {children}
          <BottomPanel>
            <Navigation />
          </BottomPanel>
        </Root>
      </body>
    </html>
  )
}
