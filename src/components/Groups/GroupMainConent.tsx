'use client'

import type { Group, Season } from '@/types/db'
import { Cell, List, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { mainButton } from '@tma.js/sdk-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GroupPlayer } from './Player/Player'

export function GroupMainContent({ group, seasons }: { group: Group, seasons: Season[] }) {
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
                <GroupPlayer key={memberId.toString()} id={memberId} isOwner={memberId.equals(group.ownerId)} />
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
