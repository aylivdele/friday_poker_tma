'use client'

import type { Group, Player, Season } from '@/types/api'
import { Cell, Headline, List, Modal, TabsList, Text } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { mainButton, secondaryButton } from '@tma.js/sdk-react'
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

export function GroupMainContent({ group, mutateGroup }: { mutateGroup: () => Promise<any>, group: Group }) {
  const swr = useSWR<Season[]>(`/api/seasons?groupId=${group._id}`, swrGetFetcher)
  const playersSwr = useSWR<Player[]>(`/api/players?groupId=${group._id}`, swrGetFetcher)

  const seasons = swr.data
  const player = usePlayerStore(s => s.player)
  const [selectedTab, setSelectedTab] = useState<'players' | 'seasons'>('players')
  const [pinOpen, setPinOpen] = useState(false)
  const [chooseModalOpen, setChooseModalOpen] = useState(false)
  const [chosenEmptyPlayer, setChosenEmptyPlayer] = useState<Player | undefined>(undefined)

  const router = useRouter()

  useEffect(() => {
    if (!mainButton || isNull(player?._id)) {
      mainButton?.hide()
      return
    }

    let unbound: (() => void) | null = null
    let unboundSecondary = null
    if (!group.members.includes(player._id)) {
      if (secondaryButton && playersSwr.data?.some(p => !p.telegramId)) {
        unboundSecondary = secondaryButton.onClick(() => setChooseModalOpen(true))
        secondaryButton.setText('Занять профиль')
        secondaryButton.setBgColor('#00FF00')
      }
      mainButton.setText('Вступить в группу')
      unbound = mainButton.onClick(() => setPinOpen(true))
    }
    else if (selectedTab === 'players' && group.ownerId === player._id) {
      mainButton.setText('Добавить игрока')
      unbound = mainButton.onClick(() => router.push(`/groups/${group._id}/${selectedTab}/new`))
    }
    else if (selectedTab === 'seasons' && group.ownerId === player._id) {
      mainButton.setText('Начать новый сезон')
      unbound = mainButton.onClick(() => router.push(`/groups/${group._id}/${selectedTab}/new`))
    }

    if (unbound) {
      mainButton.show()
    }
    if (unboundSecondary) {
      secondaryButton.show()
    }

    return () => {
      unbound?.()
      unboundSecondary?.()
    }
  }, [group, selectedTab, mainButton, secondaryButton, router, player, playersSwr])

  useEffect(() => {
    return () => {
      mainButton?.hide()
      secondaryButton?.hide()
    }
  }, [mainButton, secondaryButton, group])

  const onPinEnter = (pin: number[]) => {
    setPinOpen(false);
    (chosenEmptyPlayer
      ? api.put<Player>(`/api/players/${chosenEmptyPlayer._id}/claim`)
      : api.put(`/api/groups/${group._id}/join?pin=${pin.join('')}`))
      .then(() => {
        mutateGroup().then(() => playersSwr.mutate())
      })
      .catch((error) => {
        if (error?.error === 'Wrong password') {
          setPinOpen(true)
          toast.error('Неверный пароль')
        }
        else {
          setChosenEmptyPlayer(undefined)
          toast.error(error)
        }
      })
  }

  const chooseProfile = (player: Player) => {
    setChosenEmptyPlayer(player)
    setChooseModalOpen(false)
    setPinOpen(true)
  }

  if (isNull(seasons)) {
    return (<Loader {...swr} />)
  }

  return (
    <>
      <Modal
        header={<Headline style={{ padding: 5 }}>Выберите профиль</Headline>}
        open={chooseModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setChooseModalOpen(false)
          }
        }}
        modal
        dismissible
      >
        <List>
          {!!playersSwr.data && playersSwr.data.filter(p => !p.telegramId).map(member => (
            <GroupPlayer key={member._id} player={member} isOwner={member._id === group.ownerId} onClick={() => chooseProfile(member)} />
          ))}
        </List>
      </Modal>
      <PinModal open={pinOpen} onOpenChange={setPinOpen} onPinEnter={onPinEnter} />
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
            <Loader {...playersSwr}>
              <List>
                {playersSwr.data?.map(member => (
                  <GroupPlayer key={member._id} player={member} isOwner={member._id === group.ownerId} />
                ))}
              </List>
            </Loader>
          )
        : (
            <List>
              {seasons.map(season => (
                <Cell
                  key={season._id}
                  onClick={() => router.push(`/groups/${group._id}/seasons/${season._id}`)}
                  subtitle={(
                    <Text>
                      Игр:
                      {season.gameIds.length}
                    </Text>
                  )}
                >
                  <Text>{season.title}</Text>
                </Cell>
              ))}
            </List>
          ) }
    </>
  )
}
