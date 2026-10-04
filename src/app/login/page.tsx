'use client'

import type { Me } from '@/types/api'
import { Button, Headline, Input, Section, Subheadline, Text } from '@telegram-apps/telegram-ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useSetMe } from '@/hooks/useSetMe'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import './login.css'

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
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <Headline weight="1" className="login__title">Friday Poker</Headline>
      <Section footer={error ? <Text className="login__error">{error}</Text> : undefined}>
        <Input
          className="input"
          type="tel"
          autoComplete="username"
          inputMode="tel"
          before={<Subheadline>Телефон</Subheadline>}
          placeholder="+7 900 000-00-00"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={loading}
        />
        <Input
          className="input"
          type="password"
          autoComplete="current-password"
          before={<Subheadline>Пароль</Subheadline>}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
      </Section>
      <div className="login__actions">
        <Button type="submit" stretched size="l" loading={loading} disabled={!phone.trim() || !password}>Войти</Button>
      </div>
      <Text className="login__hint">
        Нет пароля? Откройте приложение в Telegram → Профиль → «Вход из браузера»: подтвердите номер и задайте пароль.
      </Text>
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
