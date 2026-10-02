import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

import { BottomPanel } from '@/components/ActionBar/ActionBar'
import { Root } from '@/components/Root/Root'
import Bootstrap from './bootstrap'
import { Navigation } from './navigation'
import '@telegram-apps/telegram-ui/dist/styles.css'
import 'normalize.css/normalize.css'
import './_assets/globals.css'

export const metadata: Metadata = {
  title: 'Friday Poker',
  description: 'Учёт домашних покерных игр, сезонов и достижений',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" suppressHydrationWarning>
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
