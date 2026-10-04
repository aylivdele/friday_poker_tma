'use client'

import { create } from 'zustand'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { haptic } from '@/lib/haptics'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  // красная кнопка подтверждения для необратимых действий (по умолчанию)
  destructive?: boolean
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
}

const useConfirmStore = create<ConfirmState>(() => ({ request: null }))

// Спрашивает подтверждение в общем диалоге приложения. Возвращает true, если пользователь согласился.
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  haptic('warning')
  return new Promise((resolve) => {
    useConfirmStore.getState().request?.resolve(false)
    useConfirmStore.setState({ request: { ...options, resolve } })
  })
}

function close(ok: boolean) {
  const { request } = useConfirmStore.getState()
  useConfirmStore.setState({ request: null })
  request?.resolve(ok)
}

// Монтируется один раз в корне приложения
export function ConfirmHost() {
  const request = useConfirmStore(s => s.request)

  return (
    <AlertDialog open={!!request} onOpenChange={open => !open && close(false)}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title ?? request?.description}</AlertDialogTitle>
          {request?.title && <AlertDialogDescription>{request.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" onClick={() => close(false)}>{request?.cancelText ?? 'Отмена'}</AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            variant={request?.destructive === false ? 'default' : 'destructive'}
            onClick={() => close(true)}
          >
            {request?.confirmText ?? 'Подтвердить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
