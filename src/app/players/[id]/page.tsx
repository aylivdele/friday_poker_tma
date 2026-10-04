'use client'

import type { PlayerDetails, PlayerStats } from '@/types/api'
import { use, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { EditPlayerDialog } from '@/components/player/EditPlayerDialog'
import { PlayerProfile } from '@/components/player/PlayerProfile'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const playerSwr = useSWR<PlayerDetails>(`/api/players/${id}`, swrGetFetcher)
  const { data: stats } = useSWR<PlayerStats>(`/api/players/${id}/stats`, swrGetFetcher)
  const [editOpen, setEditOpen] = useState(false)
  const player = playerSwr.data

  return (
    <Page title="Игрок">
      {player
        ? (
            <>
              <PlayerProfile player={player} stats={stats} onEdit={player.can.edit ? () => setEditOpen(true) : undefined} />
              {player.can.edit && (
                <EditPlayerDialog
                  open={editOpen}
                  onOpenChange={setEditOpen}
                  player={player}
                  onSaved={(updated) => {
                    playerSwr.mutate({ ...player, ...updated }, { revalidate: false })
                    // Составы групп покажут новое имя сразу
                    mutate(key => typeof key === 'string' && key.startsWith('/api/players?'))
                  }}
                />
              )}
            </>
          )
        : <Loader {...playerSwr} />}
    </Page>
  )
}
