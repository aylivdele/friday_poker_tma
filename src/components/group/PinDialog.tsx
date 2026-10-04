'use client'

import { Loader2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'

// Ввод PIN из 4 цифр: отправляется сам, ошибка показывается здесь же
export function PinDialog({ open, onOpenChange, title, description, onSubmit }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: (pin: string) => Promise<void>
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPin('')
      setError(null)
    }
  }, [open])

  const submit = async (value: string) => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(value)
      haptic('success')
      onOpenChange(false)
    }
    catch (e) {
      haptic('error')
      setError(getErrorMessage(e))
      setPin('')
      // Пока шла проверка, поле было заблокировано и потеряло фокус — возвращаем, чтобы сразу вводить заново
      requestAnimationFrame(() => input.current?.focus())
    }
    finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <InputOTP
            maxLength={4}
            inputMode="numeric"
            pattern="^[0-9]*$"
            ref={input}
            autoFocus
            disabled={busy}
            value={pin}
            onChange={(value) => {
              setPin(value)
              setError(null)
            }}
            onComplete={submit}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3].map(i => <InputOTPSlot key={i} index={i} className="size-12 text-xl" />)}
            </InputOTPGroup>
          </InputOTP>
          <p className="min-h-5 text-sm text-destructive" aria-live="polite">
            {busy ? <Loader2Icon className="size-4 animate-spin text-muted-foreground" /> : error}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
