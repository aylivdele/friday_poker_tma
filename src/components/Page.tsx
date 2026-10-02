'use client'

import type { PropsWithChildren } from 'react'
import { backButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isTelegram } from '@/lib/platform'

interface PageProps {
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
}

function TelegramPage({ children, back = true }: PropsWithChildren<PageProps>) {
  const router = useRouter()

  useEffect(() => {
    if (back) {
      backButton.show()
    }
    else {
      backButton.hide()
    }
  }, [back])

  useEffect(() => {
    return backButton.onClick(() => {
      router.back()
    })
  }, [router])

  return <>{children}</>
}

function BrowserPage({ children, back = true }: PropsWithChildren<PageProps>) {
  const router = useRouter()

  return (
    <>
      {back && (
        <button
          type="button"
          className="page-back"
          onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
        >
          ‹ Назад
        </button>
      )}
      {children}
    </>
  )
}

export function Page(props: PropsWithChildren<PageProps>) {
  return isTelegram() ? <TelegramPage {...props} /> : <BrowserPage {...props} />
}
