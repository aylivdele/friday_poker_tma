'use client'

import type { Group, Season } from '@/types/api'
import { Cell, List, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { mainButton } from '@tma.js/sdk-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { isNull } from '@/app/api/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { Loader } from '../Loader/Loader'
import { GroupPlayer } from './Player/Player'

export function GroupMainContent({ group }: { group: Group }) {
  const swr = useSWR<Season[]>(`/api/seasons?groupId=${group._id}`, swrGetFetcher)
  const seasons = swr.data
  const [selectedTab, setSelectedTab] = useState<'players' | 'seasons'>('players')

  const router = useRouter()

  useEffect(() => {
    if (!mainButton)
      return

    if (selectedTab === 'players') {
      mainButton.setText('Добавить игрока')
    }
    else {
      mainButton.setText('Начать новый сезон')
    }

    mainButton.show()

    const unbound = mainButton.onClick(() => router.push(`/groups/${group._id}/${selectedTab}/new`))

    return () => {
      mainButton.hide()
      unbound()
    }
  }, [group._id, selectedTab, mainButton, router])

  if (isNull(seasons)) {
    return (<Loader {...swr} />)
  }

  return (
    <>
      <TabsList>
        <TabsItem selected={selectedTab === 'players'} onClick={() => setSelectedTab('players')}>
          Игроки
        </TabsItem>
        <TabsItem selected={selectedTab === 'seasons'} onClick={() => setSelectedTab('seasons')}>
          Сезоны
        </TabsItem>
      </TabsList>
      { selectedTab === 'players'
        ? (
            <List>
              {group.members.map(memberId => (
                <GroupPlayer key={memberId.toString()} id={memberId} isOwner={memberId === group.ownerId} />
              ))}
            </List>
          )
        : (
            <List>
              {seasons.map(season => (
                <Link href={`/groups/${group._id}/seasons/${season._id}`} key={season._id?.toString()}>
                  <Cell subtitle={`Игр: ${season.gameIds.length}`}>{season.title}</Cell>
                </Link>
              ))}
            </List>
          ) }
    </>
  )
}
