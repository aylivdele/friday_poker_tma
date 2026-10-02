'use client'

import type { Me } from '@/types/api'
import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getErrorMessage } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '../lib/api'

// Загружает текущего игрока: в Telegram — регистрирует по данным Telegram, в браузере — по cookie сессии.
// Без сессии api сам отправит на страницу входа.
export default function Bootstrap() {
  const setPlayer = usePlayerStore(s => s.setPlayer)

  useEffect(() => {
    if (!isTelegram() && window.location.pathname === '/login') {
      return
    }
    let cancelled = false
    const load = isTelegram() ? api.post<Me>('/api/auth/telegram') : api.get<Me>('/api/me')

    load
      .then((player) => {
        if (!cancelled) {
          setPlayer(player)
        }
      })
      .catch((e) => {
        if (!isTelegram()) {
          return
        }
        console.error('Error fetching/creating player:', e)
        toast.error(`Не удалось загрузить профиль: ${getErrorMessage(e)}`)
      })

    return () => {
      cancelled = true
    }
  }, [setPlayer])

  return <Toaster />
}
