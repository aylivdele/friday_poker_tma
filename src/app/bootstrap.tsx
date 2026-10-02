'use client'

import type { Player } from '@/types/api'
import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getErrorMessage } from '@/lib/errors'
import { isTelegram } from '@/lib/platform'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '../lib/api'

export default function Bootstrap() {
  const setPlayer = usePlayerStore(s => s.setPlayer)

  useEffect(() => {
    if (!isTelegram()) {
      return
    }
    let cancelled = false

    api.post<Player>('/api/auth/telegram')
      .then((player) => {
        if (!cancelled) {
          setPlayer(player)
        }
      })
      .catch((e) => {
        console.error('Error fetching/creating player:', e)
        toast.error(`Не удалось загрузить профиль: ${getErrorMessage(e)}`)
      })

    return () => {
      cancelled = true
    }
  }, [setPlayer])

  return <Toaster />
}
