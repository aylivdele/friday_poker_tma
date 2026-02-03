'use client'

import type { Player } from '@/types/api'
import { Avatar, AvatarStack, Info, List, Section, Text } from '@telegram-apps/telegram-ui'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { api } from '@/lib/api'
import { isNull } from '@/lib/helpers'
import { usePlayerStore } from '@/stores/playerStore'

export default function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const profilePlayer = usePlayerStore(s => s.player)
  const [loading, setLoading] = useState<boolean>(true)
  const [player, setPlayer] = useState<Player | null | undefined>(undefined)

  useEffect(() => {
    if (profilePlayer && profilePlayer._id === id) {
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

  if (isNull(player)) {
    return (<Loader data={player} isLoading={loading} error={null} />)
  }

  return (
    <Page>
      <Section header={`Профиль: ${player.firstName} ${player.lastName}`}>
        <List>
          <Avatar size={96} src={player.avatarUrl} />
          <Text>
            username:
            {' '}
            {player.username}
          </Text>
          <Info
            avatarStack={(
              <AvatarStack>
                <Avatar size={28} />
                <Avatar size={28} />
                <Avatar size={28} />
              </AvatarStack>
            )}
            type="avatarStack"
          >
            Достижения
          </Info>
        </List>
      </Section>
    </Page>
  )
}
