'use client'

import type { Me, PlayerStats } from '@/types/api'
import useSWR from 'swr'
import { TabHeader } from '@/components/app/TabHeader'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { PlayerProfile } from '@/components/player/PlayerProfile'
import { AppearanceSettings } from '@/components/profile/AppearanceSettings'
import { BrowserAccess } from '@/components/profile/BrowserAccess'
import { NotificationSettings } from '@/components/profile/NotificationSettings'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function ProfilePage() {
  const meSwr = useSWR<Me>('/api/me', swrGetFetcher)
  const me = meSwr.data
  const { data: stats } = useSWR<PlayerStats>(me ? `/api/players/${me._id}/stats` : null, swrGetFetcher)

  return (
    <Page back={false}>
      <TabHeader title="Профиль" />
      {me
        ? (
            <PlayerProfile player={me} stats={stats}>
              <NotificationSettings />
              <AppearanceSettings />
              <BrowserAccess />
            </PlayerProfile>
          )
        : <Loader {...meSwr} />}
    </Page>
  )
}
