'use client'

import type { Group, Season } from '@/types/api'
import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { use, useState } from 'react'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { SeasonGames } from '@/components/Seasons/SeasonGames'
import { SeasonTable } from '@/components/Seasons/SeasonTable'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'

export default function SeasonPage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const seasonSwr = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const season = seasonSwr.data
  const groupSwr = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const group = groupSwr.data
  const [selectedTab, setSelectedTab] = useState<'games' | 'table'>('games')

  if (isNull(season)) {
    return <Loader {...seasonSwr} />
  }
  if (isNull(group)) {
    return <Loader {...groupSwr} />
  }

  return (
    <Page>
      <Section header={`Сезон: ${season.title}`}>

        <TabsList>
          <TabsList.Item selected={selectedTab === 'games'} onClick={() => setSelectedTab('games')}>
            Игры
          </TabsList.Item>
          <TabsList.Item selected={selectedTab === 'table'} onClick={() => setSelectedTab('table')}>
            Таблица
          </TabsList.Item>
        </TabsList>
        {
          selectedTab === 'games'
            ? (<SeasonGames groupMembers={group.members} seasonId={seasonId} groupId={groupId} />)
            : (<SeasonTable seasonId={seasonId} />)
        }

      </Section>
    </Page>
  )
}
