'use client'

import type { Me } from '@/types/api'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSetMe } from '@/hooks/useSetMe'
import { ApiError, getErrorMessage, TELEGRAM_EXPIRED } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import { api } from '../lib/api'

// Загружает текущего игрока: в Telegram — регистрирует по данным Telegram, в браузере — по cookie сессии.
// Без сессии api сам отправит на страницу входа.
export default function Bootstrap() {
  const setMe = useSetMe()

  useEffect(() => {
    if (!isTelegram() && window.location.pathname === '/login') {
      return
    }
    let cancelled = false
    const load = isTelegram() ? api.post<Me>('/api/auth/telegram') : api.get<Me>('/api/me')

    load
      .then((me) => {
        if (!cancelled) {
          setMe(me)
        }
      })
      .catch((e) => {
        // В браузере api сам отправит на вход, а про устаревшие данные Telegram расскажет SessionExpired
        if (!isTelegram() || (e instanceof ApiError && e.code === TELEGRAM_EXPIRED)) {
          return
        }
        console.error('Error fetching/creating player:', e)
        toast.error(`Не удалось загрузить профиль: ${getErrorMessage(e)}`)
      })

    return () => {
      cancelled = true
    }
  }, [setMe])

  return null
}
