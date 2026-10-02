'use client'

import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { PlayerComponent } from '@/components/Player/Player'
import { BrowserAccess } from '@/components/Profile/BrowserAccess'
import { isNull } from '@/lib/helpers'
import { usePlayerStore } from '@/stores/playerStore'

export default function ProfilePage() {
  const profilePlayer = usePlayerStore(s => s.player)

  if (isNull(profilePlayer)) {
    return (
      <Page back={false}>
        <Loader data={profilePlayer} isLoading={true} error={null} />
      </Page>
    )
  }

  return (
    <Page back={false}>
      <PlayerComponent player={profilePlayer}>
        <BrowserAccess />
      </PlayerComponent>
    </Page>
  )
}
