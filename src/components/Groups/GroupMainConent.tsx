'use client'

import type { Group, Season } from '@/types/api'
import { Cell, List, TabsList } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { mainButton } from '@tma.js/sdk-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'
import { Loader } from '../Loader/Loader'
import { PinModal } from './PinModal'
import { GroupPlayer } from './Player/Player'

export function GroupMainContent({ group, mutateGroup }: { mutateGroup: () => void, group: Group }) {
  const swr = useSWR<Season[]>(`/api/seasons?groupId=${group._id}`, swrGetFetcher)
  const seasons = swr.data
  const player = usePlayerStore(s => s.player)
  const [selectedTab, setSelectedTab] = useState<'players' | 'seasons'>('players')
  const [modalOpen, setModalOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (!mainButton || isNull(player?._id))
      return

    let unbound: (() => void) | null = null
    if (!group.members.includes(player._id)) {
      mainButton.setText('Вступить в группу')
      unbound = mainButton.onClick(() => setModalOpen(true))
    }
    else if (selectedTab === 'players' && group.ownerId === player._id) {
      mainButton.setText('Добавить игрока')
      unbound = mainButton.onClick(() => router.push(`/groups/${group._id}/${selectedTab}/new`))
    }
    else if (selectedTab === 'players' && group.ownerId === player._id) {
      mainButton.setText('Начать новый сезон')
      unbound = mainButton.onClick(() => router.push(`/groups/${group._id}/${selectedTab}/new`))
    }

    if (unbound) {
      mainButton.show()
    }

    return () => {
      mainButton.hide()
      unbound?.()
    }
  }, [group, selectedTab, mainButton, router, player])

  const onPinEnter = (pin: number[]) => {
    setModalOpen(false)
    api.put(`/api/groups/${group._id}/join?pin=${pin.join('')}`).then(() => {
      mutateGroup()
    }).catch((error) => {
      if (error?.error === 'Wrong password') {
        setModalOpen(true)
        toast.error('Неверный пароль')
      }
      else {
        toast.error(error)
      }
    })
  }

  if (isNull(seasons)) {
    return (<Loader {...swr} />)
  }

  return (
    <>
      <PinModal open={modalOpen} onOpenChange={setModalOpen} onPinEnter={onPinEnter} />
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
