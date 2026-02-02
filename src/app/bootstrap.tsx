'use client'

import type { Player } from '@/types/api'
import { initData, useSignal } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast/headless'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '../lib/api'

export default function Bootstrap() {
  const setPlayer = usePlayerStore(s => s.setPlayer)
  const router = useRouter()
  const rawInitData = useSignal(initData.raw)

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

    if (rawInitData) {
      // eslint-disable-next-line no-console
      console.log(`raw sdk init data ${rawInitData}\n`
      // @ts-expect-error qwe
        + `raw native init data ${window.Telegram?.WebApp?.initData}`)
      init()

      return () => {
        cancelled = true
      }
    }
  }, [setPlayer, router, rawInitData])

  return <Toaster />
}
