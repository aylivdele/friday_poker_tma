'use client'

import type { Group, Season } from '@/types/api'
import { Section, TabsList } from '@telegram-apps/telegram-ui'
import { secondaryButton } from '@tma.js/sdk-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { SeasonGames } from '@/components/Seasons/SeasonGames'
import { SeasonTable } from '@/components/Seasons/SeasonTable'
import { api } from '@/lib/api'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'

export default function SeasonPage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const seasonSwr = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const season = seasonSwr.data
  const groupSwr = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const group = groupSwr.data
  const [selectedTab, setSelectedTab] = useState<'games' | 'table'>('games')
  const player = usePlayerStore(s => s.player)
  const router = useRouter()

  const handleDelete = () => {
    if (isNull(seasonId) || isNull(groupId)) {
      return
    }
    return api.delete(`/api/seasons/${seasonId}`).then(() => router.replace('/groups')).then(() => router.back()).catch((reason) => {
      console.error(reason)
      toast.error(`Ошибка: ${reason}`)
    })
  }

  useEffect(() => {
    if (!secondaryButton || isNull(season) || isNull(group) || isNull(player) || group.ownerId !== player._id) {
      secondaryButton.hide()
      return
    }
    secondaryButton.setText('Удалить сезон')
    secondaryButton.setBgColor('#FF0000')
    secondaryButton.show()

    const unmount = secondaryButton.onClick(handleDelete)

    return () => {
      unmount()
    }
  }, [secondaryButton, season, group, player])

  useEffect(() => {
    return () => secondaryButton.hide()
  }, [])

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
