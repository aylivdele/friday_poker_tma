'use client'

import type { Me } from '@/types/api'
import { CircleAlertIcon, Loader2Icon, SpadeIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSetMe } from '@/hooks/useSetMe'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { haptic } from '@/lib/haptics'
import { isTelegram } from '@/lib/platform'

// Возвращаем только на свои страницы: «//evil.com» и полные адреса не принимаем
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

function LoginForm() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const setMe = useSetMe()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Внутри Telegram вход происходит автоматически
    if (isTelegram()) {
      router.replace('/')
    }
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      setMe(await api.post<Me>('/api/auth/login', { phone, password }))
      router.replace(next)
    }
    catch (err) {
      haptic('error')
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form className="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pt-[12vh] pb-8" onSubmit={submit}>
      <div className="flex flex-col items-center gap-3 pb-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-[20px] bg-primary text-primary-foreground shadow-sm">
          <SpadeIcon className="size-8" fill="currentColor" />
        </span>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Friday Poker</h1>
        <p className="text-[15px] text-muted-foreground">Вход по номеру телефона и паролю</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-phone">Телефон</Label>
        <Input
          id="login-phone"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="+7 900 000-00-00"
          className="h-12 rounded-xl bg-card text-base"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={loading}
          aria-invalid={!!error}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Пароль</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="h-12 rounded-xl bg-card text-base"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
          aria-invalid={!!error}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 rounded-xl text-base" disabled={loading || !phone.trim() || !password}>
        {loading && <Loader2Icon className="size-4 animate-spin" />}
        Войти
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Нет пароля? Откройте приложение в Telegram → «Профиль» → «Вход из браузера»: подтвердите номер и задайте пароль.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
