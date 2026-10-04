'use client'

import type { PropsWithChildren, ReactNode } from 'react'
import { backButton } from '@tma.js/sdk-react'
import { ChevronLeftIcon, EllipsisIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { canGoBack, parentPath } from '@/lib/navigation'
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

// Назад по истории приложения, а если открыли сразу эту страницу — к родительскому экрану
function useGoBack() {
  const router = useRouter()
  const pathname = usePathname()
  return useCallback(() => {
    if (canGoBack()) {
      router.back()
    }
    else {
      router.replace(parentPath(pathname))
    }
  }, [router, pathname])
}

function useTelegramBackButton(back: boolean, goBack: () => void) {
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
    return backButton.onClick(goBack)
  }, [goBack])
}

export function Page({ children, back = true, title, subtitle, menu }: PropsWithChildren<PageProps>) {
  const goBack = useGoBack()
  useTelegramBackButton(back, goBack)
  // В Telegram «назад» — нативная кнопка клиента, в браузере — своя в шапке
  const showBack = back && !isTelegram()

  return (
    <div className="mx-auto w-full max-w-2xl">
      {title !== undefined
        ? (
            <header className="sticky top-0 z-2 grid min-h-14 grid-cols-[44px_1fr_44px] items-center gap-1 bg-background/90 px-1.5 py-1 backdrop-blur supports-backdrop-filter:bg-background/75">
              {showBack
                ? (
                    <Button variant="ghost" size="icon" className="size-11 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" aria-label="Назад" onClick={goBack}>
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
              onClick={goBack}
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
