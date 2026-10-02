'use client'

import type { PropsWithChildren, ReactNode } from 'react'
import { Button } from '@telegram-apps/telegram-ui'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './ActionBar.css'

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
    <div ref={ref} className="bottom-panel">
      <div id={SLOT_ID} />
      {children}
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
  return createPortal(<div className="action-bar">{children}</div>, slot)
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
      stretched
      size="l"
      mode={variant === 'primary' ? 'filled' : 'bezeled'}
      className={variant === 'destructive' ? 'action-button--destructive' : undefined}
      loading={loading}
      disabled={disabled || loading}
      onClick={() => {
        // Снимаем фокус с поля ввода, чтобы оно успело отдать значение до действия
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        onClick()
      }}
    >
      {children}
    </Button>
  )
}

export function ActionHint({ children }: PropsWithChildren) {
  return <div className="action-hint">{children}</div>
}
