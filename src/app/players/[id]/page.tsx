'use client'
import type { Player } from '@/types/types'
import { Cell, Section, Spinner, Text } from '@telegram-apps/telegram-ui'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/app/api/client'
import { usePlayerStore } from '@/stores/playerStore'

export function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const profilePlayer = usePlayerStore(s => s.player)
  const [loading, setLoading] = useState<boolean>(true)
  const [player, setPlayer] = useState<Player | null | undefined>(undefined)

  useEffect(() => {
    if (profilePlayer && profilePlayer._id?.toString() === id) {
      setPlayer(profilePlayer)
      setLoading(false)
      return
    }
    setLoading(true)
    api.get<Player>(`/api/players/${id}`).catch((e) => {
      console.error('Error fetching player:', e)
      toast.error(`Ошибка при загрузке данных игрока: ${e}`)
      return null
    }).then(p => setPlayer(p)).finally(() => {
      setLoading(false)
    })
  }, [profilePlayer, id])

  if (!player) {
    if (loading) {
      return <Cell before={<Spinner size="m" />}><Text weight="2">Загрузка...</Text></Cell>
    }
    return <Text weight="2">Ошибка при загрузке данных игрока. Попробуйте перезагрузить страницу.</Text>
  }
  return (
    <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>

    </Section>
  )
}
