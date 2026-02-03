'use client'

import { Loader } from '@/components/Loader/Loader'
import { PlayerComponent } from '@/components/Player/Player'
import { isNull } from '@/lib/helpers'
import { usePlayerStore } from '@/stores/playerStore'

export default function PlayersPage() {
  const profilePlayer = usePlayerStore(s => s.player)

  if (isNull(profilePlayer)) {
    return (<Loader data={profilePlayer} isLoading={true} error={null} />)
  }

  return (
    <PlayerComponent player={profilePlayer} />
  )
}
