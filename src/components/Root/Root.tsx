'use client'

import type { PropsWithChildren } from 'react'
import { miniApp, useSignal } from '@tma.js/sdk-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { ConfirmHost } from '@/components/app/confirm'
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

// Применяет выбранное оформление и рисует корень приложения
function AppFrame({ children, telegramDark, systemDark }: PropsWithChildren<{ telegramDark: boolean, systemDark: boolean }>) {
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
    <div className="root">
      {children}
      <Toaster />
      <ConfirmHost />
    </div>
  )
}

function TelegramRoot({ children }: PropsWithChildren) {
  const telegramDark = useSignal(miniApp.isDark)
  const systemDark = usePrefersDark()

  return <AppFrame telegramDark={telegramDark} systemDark={systemDark}>{children}</AppFrame>
}

function BrowserRoot({ children }: PropsWithChildren) {
  const systemDark = usePrefersDark()

  return <AppFrame telegramDark={false} systemDark={systemDark}>{children}</AppFrame>
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
