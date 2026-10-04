'use client'

import type { PropsWithChildren, ReactNode } from 'react'
import { backButton } from '@tma.js/sdk-react'
import { ChevronLeftIcon, EllipsisIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { isTelegram } from '@/lib/platform'

interface PageProps {
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
  title?: ReactNode
  subtitle?: ReactNode
  // пункты меню «⋯» в шапке (DropdownMenuItem)
  menu?: ReactNode
}

function useTelegramBackButton(back: boolean) {
  const router = useRouter()

  useEffect(() => {
    if (!isTelegram()) {
      return
    }
    if (back) {
      backButton.show()
    }
    else {
      backButton.hide()
    }
  }, [back])

  useEffect(() => {
    if (!isTelegram()) {
      return
    }
    return backButton.onClick(() => {
      router.back()
    })
  }, [router])
}

function goBack(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) {
    router.back()
  }
  else {
    router.push('/')
  }
}

export function Page({ children, back = true, title, subtitle, menu }: PropsWithChildren<PageProps>) {
  const router = useRouter()
  useTelegramBackButton(back)
  // В Telegram «назад» — нативная кнопка клиента, в браузере — своя в шапке
  const showBack = back && !isTelegram()

  return (
    <div className="mx-auto w-full max-w-2xl">
      {title !== undefined
        ? (
            <header className="sticky top-0 z-2 grid min-h-14 grid-cols-[44px_1fr_44px] items-center gap-1 bg-background/90 px-1.5 py-1 backdrop-blur supports-backdrop-filter:bg-background/75">
              {showBack
                ? (
                    <Button variant="ghost" size="icon" className="size-11 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" aria-label="Назад" onClick={() => goBack(router)}>
                      <ChevronLeftIcon className="size-6" />
                    </Button>
                  )
                : <span />}
              <div className="flex min-w-0 flex-col items-center text-center">
                <h1 className="max-w-full truncate text-[17px] font-semibold">{title}</h1>
                {subtitle && <div className="flex max-w-full items-center gap-1.5 truncate text-[13px] text-muted-foreground">{subtitle}</div>}
              </div>
              {menu
                ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-11 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" aria-label="Ещё">
                          <EllipsisIcon className="size-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-52">{menu}</DropdownMenuContent>
                    </DropdownMenu>
                  )
                : <span />}
            </header>
          )
        : showBack && (
          <div className="sticky top-0 z-2 bg-background/90 px-2 py-1 backdrop-blur supports-backdrop-filter:bg-background/75">
            <Button
              variant="ghost"
              className="h-11 gap-1 px-2 text-base font-medium text-primary-text hover:bg-secondary hover:text-primary-text"
              onClick={() => goBack(router)}
            >
              <ChevronLeftIcon className="size-6" />
              Назад
            </Button>
          </div>
        )}
      {children}
    </div>
  )
}
