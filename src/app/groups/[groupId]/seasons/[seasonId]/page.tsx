'use client'

import type { Group, Season } from '@/types/api'
import { Section } from '@telegram-apps/telegram-ui'
import { use } from 'react'
import useSWR from 'swr'
import { SeasonGames } from '@/components/Games/NewGameButton'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default async function SeasonPage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const swr = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const season = swr.data
  const groupSwr = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const group = groupSwr.data

  if (isNull(season)) {
    return <Loader {...swr} />
  }
  if (isNull(group)) {
    return <Loader {...groupSwr} />
  }

  return (
    <Page>
      <Section header={`Сезон: ${season.title}`}>
        <SeasonGames groupMembers={group.members} seasonId={seasonId} groupId={groupId} />
      </Section>
    </Page>
  )
}
