import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

import { FixedLayout } from '@telegram-apps/telegram-ui'

import { Root } from '@/components/Root/Root'
import Bootstrap from './bootstrap'
import { Navigation } from './navigation'
import '@telegram-apps/telegram-ui/dist/styles.css'
import 'normalize.css/normalize.css'
import './_assets/globals.css'

export const metadata: Metadata = {
  title: 'Friday Poker',
  description: 'TMA Friday Poker Bot Web Interface',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Root>
          <Bootstrap />
          {children}
          <FixedLayout>
            <Navigation />
          </FixedLayout>
        </Root>
      </body>
    </html>
  )
}
