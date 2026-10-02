'use client'

import type { Group, Player, Season } from '@/types/api'
import { Cell, Headline, List, Modal, TabsList, Text } from '@telegram-apps/telegram-ui'
import { TabsItem } from '@telegram-apps/telegram-ui/dist/components/Navigation/TabsList/components/TabsItem/TabsItem'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { ApiError, getErrorMessage } from '@/lib/errors'
import { isNull } from '@/lib/helpers'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { ActionBar, ActionButton } from '../ActionBar/ActionBar'
import { confirmAction } from '../ConfirmButton/ConfirmButton'
import { Loader } from '../Loader/Loader'
import { PinModal } from './PinModal'
import { GroupPlayer } from './Player/Player'

export function GroupMainContent({ group, mutateGroup }: { mutateGroup: () => Promise<any>, group: Group }) {
  const swr = useSWR<Season[]>(`/api/seasons?groupId=${group._id}`, swrGetFetcher)
  const playersSwr = useSWR<Player[]>(`/api/players?groupId=${group._id}`, swrGetFetcher)

  const seasons = swr.data
  const [selectedTab, setSelectedTab] = useState<'players' | 'seasons'>('players')
  const [pinOpen, setPinOpen] = useState(false)
  const [chooseModalOpen, setChooseModalOpen] = useState(false)
  const [chosenEmptyPlayer, setChosenEmptyPlayer] = useState<Player | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const router = useRouter()
  const virtualPlayers = playersSwr.data?.filter(p => !p.hasTelegram) ?? []

  const onPinEnter = async (pin: number[]) => {
    setPinOpen(false)
    setBusy(true)
    try {
      if (chosenEmptyPlayer) {
        await api.put(`/api/players/${chosenEmptyPlayer._id}/claim`, { groupId: group._id, pin: pin.join('') })
        toast.success('Профиль теперь ваш')
      }
      else {
        await api.put(`/api/groups/${group._id}/join`, { pin: pin.join('') })
        toast.success('Вы вступили в группу')
      }
      setChosenEmptyPlayer(undefined)
      await mutateGroup()
      await playersSwr.mutate()
    }
    catch (error) {
      toast.error(getErrorMessage(error))
      if (error instanceof ApiError && error.status === 403) {
        setPinOpen(true)
      }
      else {
        setChosenEmptyPlayer(undefined)
      }
    }
    finally {
      setBusy(false)
    }
  }

  const chooseProfile = (player: Player) => {
    setChosenEmptyPlayer(player)
    setChooseModalOpen(false)
    setPinOpen(true)
  }

  const deleteGroup = async () => {
    const confirmed = await confirmAction({
      title: 'Удалить группу?',
      description: 'Вместе с группой будут удалены все её сезоны и игры. Это нельзя отменить.',
      confirmText: 'Удалить',
    })
    if (!confirmed) {
      return
    }
    setBusy(true)
    try {
      await api.delete(`/api/groups/${group._id}`)
      toast.success('Группа удалена')
      router.replace('/groups')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setBusy(false)
    }
  }

  const leaveGroup = async () => {
    const confirmed = await confirmAction({ description: 'Покинуть группу?', confirmText: 'Покинуть' })
    if (!confirmed) {
      return
    }
    setBusy(true)
    try {
      await api.put(`/api/groups/${group._id}/leave`)
      toast.success('Вы покинули группу')
      router.replace('/groups')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
      setBusy(false)
    }
  }

  if (isNull(seasons)) {
    return (<Loader {...swr} />)
  }

  return (
    <>
      <Modal
        header={<Headline style={{ padding: 5 }}>Выберите свой профиль</Headline>}
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
          {virtualPlayers.map(member => (
            <GroupPlayer key={member._id} player={member} isOwner={member._id === group.ownerId} onClick={() => chooseProfile(member)} />
          ))}
        </List>
      </Modal>
      <PinModal
        open={pinOpen}
        onOpenChange={setPinOpen}
        onPinEnter={onPinEnter}
        label={chosenEmptyPlayer ? `PIN группы, чтобы занять профиль «${chosenEmptyPlayer.firstName ?? ''}»` : 'Введите PIN группы'}
      />
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
              {seasons.length === 0 && <Cell><Text>Сезонов пока нет</Text></Cell>}
              {seasons.map(season => (
                <Cell
                  key={season._id}
                  onClick={() => router.push(`/groups/${group._id}/seasons/${season._id}`)}
                  subtitle={`Игр: ${season.gameIds.length}`}
                >
                  <Text>{season.title}</Text>
                </Cell>
              ))}
            </List>
          ) }

      <ActionBar>
        {pinOpen && (
          <ActionButton
            variant="secondary"
            onClick={() => {
              setPinOpen(false)
              setChosenEmptyPlayer(undefined)
            }}
          >
            Отмена
          </ActionButton>
        )}
        {!pinOpen && group.can.join && (
          <ActionButton loading={busy} onClick={() => setPinOpen(true)}>Вступить в группу</ActionButton>
        )}
        {!pinOpen && group.can.join && virtualPlayers.length > 0 && (
          <ActionButton variant="secondary" disabled={busy} onClick={() => setChooseModalOpen(true)}>Это я — занять профиль</ActionButton>
        )}
        {group.can.manage && selectedTab === 'players' && (
          <ActionButton onClick={() => router.push(`/groups/${group._id}/players/new`)}>Добавить игрока</ActionButton>
        )}
        {group.can.manage && selectedTab === 'seasons' && (
          <ActionButton onClick={() => router.push(`/groups/${group._id}/seasons/new`)}>Новый сезон</ActionButton>
        )}
        {group.can.leave && (
          <ActionButton variant="destructive" loading={busy} onClick={leaveGroup}>Покинуть группу</ActionButton>
        )}
        {group.can.delete && (
          <ActionButton variant="destructive" loading={busy} onClick={deleteGroup}>Удалить группу</ActionButton>
        )}
      </ActionBar>
    </>
  )
}
