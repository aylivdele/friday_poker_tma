'use client'

import type { PropsWithChildren } from 'react'
import { AppRoot } from '@telegram-apps/telegram-ui'
import {
  miniApp,
  retrieveLaunchParams,
  useSignal,
} from '@tma.js/sdk-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { ConfirmHost } from '@/components/ConfirmButton/ConfirmButton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorPage } from '@/components/ErrorPage'
import { Toaster } from '@/components/ui/sonner'
import { useDidMount } from '@/hooks/useDidMount'
import { resolveAppearance } from '@/lib/appearance'
import { isTelegram } from '@/lib/platform'
import { useAppearanceStore } from '@/stores/appearanceStore'
import { applyAppearance } from './applyAppearance'

import './styles.css'

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

// Применяет выбранное оформление и рисует корень приложения.
// Экраны на telegram-ui пока требуют AppRoot; её цвета берутся из наших токенов (см. globals.css).
function AppFrame({ children, telegramDark, systemDark, platform }: PropsWithChildren<{ telegramDark: boolean, systemDark: boolean, platform: 'ios' | 'base' }>) {
  const appearance = useAppearanceStore(s => s.appearance)
  const setResolved = useAppearanceStore(s => s.setResolved)
  const resolved = useMemo(
    () => resolveAppearance(appearance, { inTelegram: isTelegram(), telegramDark, systemDark }),
    [appearance, telegramDark, systemDark],
  )

  useLayoutEffect(() => {
    applyAppearance(resolved)
    setResolved(resolved)
  }, [resolved, setResolved])

  return (
    <AppRoot appearance={resolved.dark ? 'dark' : 'light'} platform={platform} className="root">
      {children}
      <Toaster />
      <ConfirmHost />
    </AppRoot>
  )
}

function TelegramRoot({ children }: PropsWithChildren) {
  const telegramDark = useSignal(miniApp.isDark)
  const systemDark = usePrefersDark()
  const platform = useMemo(() => {
    try {
      return retrieveLaunchParams().tgWebAppPlatform
    }
    catch {
      return 'unknown'
    }
  }, [])

  return (
    <AppFrame telegramDark={telegramDark} systemDark={systemDark} platform={['macos', 'ios'].includes(platform) ? 'ios' : 'base'}>
      {children}
    </AppFrame>
  )
}

function BrowserRoot({ children }: PropsWithChildren) {
  const systemDark = usePrefersDark()

  return (
    <AppFrame telegramDark={false} systemDark={systemDark} platform="base">
      {children}
    </AppFrame>
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
          {isTelegram() ? <TelegramRoot {...props} /> : <BrowserRoot {...props} />}
        </ErrorBoundary>
      )
    : (
        <div className="root__loading">Загрузка…</div>
      )
}
