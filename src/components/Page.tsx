'use client'

import type { PropsWithChildren } from 'react'
import { backButton } from '@tma.js/sdk-react'
import { ChevronLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
        <div className="sticky top-0 z-2 bg-background/90 px-2 py-1 backdrop-blur supports-backdrop-filter:bg-background/75">
          <Button
            variant="ghost"
            className="h-11 gap-1 px-2 text-base font-medium text-primary-text hover:bg-secondary hover:text-primary-text"
            onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
          >
            <ChevronLeftIcon className="size-6" />
            Назад
          </Button>
        </div>
      )}
      {children}
    </>
  )
}

export function Page(props: PropsWithChildren<PageProps>) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      {isTelegram() ? <TelegramPage {...props} /> : <BrowserPage {...props} />}
    </div>
  )
}
