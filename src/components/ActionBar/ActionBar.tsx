'use client'

import type { PropsWithChildren, ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

const SLOT_ID = 'action-bar-slot'

// Закреплённая нижняя панель: кнопки действий страницы над вкладками.
// Её высота пишется в --bottom-panel-height, чтобы контент страницы не прятался под ней.
export function BottomPanel({ children }: PropsWithChildren) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const update = () => document.documentElement.style.setProperty('--bottom-panel-height', `${el.offsetHeight}px`)
    const observer = new ResizeObserver(update)
    observer.observe(el)
    update()
    return () => observer.disconnect()
  }, [])

  return (
    // z-index ниже модальных окон telegram-ui (3) и диалогов (50), выше обычного контента
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-2 border-t bg-bar pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl">
        <div id={SLOT_ID} />
        {children}
      </div>
    </div>
  )
}

// Кнопки действий страницы. Рендерятся в нижнюю панель через портал.
export function ActionBar({ children }: PropsWithChildren) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setSlot(document.getElementById(SLOT_ID))
  }, [])

  if (!slot) {
    return null
  }
  return createPortal(<div className="flex flex-col gap-2 px-4 py-3 empty:hidden">{children}</div>, slot)
}

export function ActionButton({
  children,
  onClick,
  loading,
  disabled,
  variant = 'primary',
}: {
  children: ReactNode
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'destructive'
}) {
  return (
    <Button
      size="lg"
      variant={variant === 'primary' ? 'default' : variant === 'secondary' ? 'secondary' : 'destructive'}
      className={cn('h-12 w-full rounded-xl text-base font-semibold')}
      disabled={disabled || loading}
      onClick={() => {
        // Снимаем фокус с поля ввода, чтобы оно успело отдать значение до действия
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        haptic('tap')
        onClick()
      }}
    >
      {loading && <Loader2Icon className="size-5 animate-spin" />}
      {children}
    </Button>
  )
}

export function ActionHint({ children }: PropsWithChildren) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>
}
