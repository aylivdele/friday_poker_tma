'use client'

import type { PropsWithChildren } from 'react'
import { AppRoot, Headline, Text } from '@telegram-apps/telegram-ui'
import {
  miniApp,
  retrieveLaunchParams,
  useSignal,
} from '@tma.js/sdk-react'
import { useEffect, useMemo, useState } from 'react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorPage } from '@/components/ErrorPage'
import { useDidMount } from '@/hooks/useDidMount'
import { isTelegram } from '@/lib/platform'

import './styles.css'

function TelegramRoot({ children }: PropsWithChildren) {
  const isDark = useSignal(miniApp.isDark)
  const platform = useMemo(() => {
    try {
      return retrieveLaunchParams().tgWebAppPlatform
    }
    catch {
      return 'unknown'
    }
  }, [])

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(platform) ? 'ios' : 'base'}
      className="root"
    >
      {children}
    </AppRoot>
  )
}

function usePrefersDark() {
  const [isDark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return isDark
}

function BrowserRoot() {
  const isDark = usePrefersDark()

  return (
    <AppRoot appearance={isDark ? 'dark' : 'light'} platform="base" className="root">
      <div className="browser-notice">
        <Headline weight="2">Friday Poker</Headline>
        <Text>Пока приложение работает только внутри Telegram. Вход из браузера появится в ближайшем обновлении.</Text>
      </div>
    </AppRoot>
  )
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of
  // the Server Side Rendering. That's why we are showing loader on the server
  // side.
  const didMount = useDidMount()

  return didMount
    ? (
        <ErrorBoundary fallback={ErrorPage}>
          {isTelegram() ? <TelegramRoot {...props} /> : <BrowserRoot />}
        </ErrorBoundary>
      )
    : (
        <div className="root__loading">Загрузка…</div>
      )
}
