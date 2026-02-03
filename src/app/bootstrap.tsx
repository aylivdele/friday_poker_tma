'use client'

import type { Player } from '@/types/api'
import { initData, retrieveRawInitData, useSignal } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast/headless'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '../lib/api'

export default function Bootstrap() {
  const setPlayer = usePlayerStore(s => s.setPlayer)
  const rawInitData = useSignal(initData.raw)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const player = await api.post<Player>('/api/players?useInitData=true')

        if (cancelled)
          return

        setPlayer(player)
      }
      catch (e) {
        console.error('Error fetching/creating player:', e)
        toast.error(`Ошибка при загрузке данных игрока: ${e}`)
      }
    }

    if (rawInitData) {
      init()

      return () => {
        cancelled = true
      }
    }
  }, [setPlayer, rawInitData])

  return <Toaster />
}
