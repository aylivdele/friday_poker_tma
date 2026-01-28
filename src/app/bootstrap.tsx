'use client'

import type { Player } from '@/types/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast/headless'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '../lib/client'

export default function Bootstrap() {
  const setPlayer = usePlayerStore(s => s.setPlayer)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const player = await api.post<Player>('/api/players?useInitData=true')

        if (cancelled)
          return

        setPlayer(player)

        router.replace(`/players/${player._id}`)
      }
      catch (e) {
        console.error('Error fetching/creating player:', e)
        toast.error(`Ошибка при загрузке данных игрока: ${e}`)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [setPlayer, router])

  return null
}
