'use client'

import type { PropsWithChildren } from 'react'
import { AppRoot } from '@telegram-apps/telegram-ui'
import {
  miniApp,
  useLaunchParams,
  useSignal,
} from '@tma.js/sdk-react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorPage } from '@/components/ErrorPage'
import { useDidMount } from '@/hooks/useDidMount'

import './styles.css'

function RootInner({ children }: PropsWithChildren) {
  const lp = useLaunchParams()

  const isDark = useSignal(miniApp.isDark)

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={
        ['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'
      }
    >
      {children}
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
          <RootInner {...props} />
        </ErrorBoundary>
      )
    : (
        <div className="root__loading">Loading</div>
      )
}
