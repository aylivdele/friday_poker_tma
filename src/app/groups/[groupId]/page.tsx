'use client'

import type { Group, GroupStats, Player, Season, SeasonTableResponse } from '@/types/api'
import { ChevronRightIcon, CrownIcon, KeyRoundIcon, LogOutIcon, PlusIcon, Trash2Icon, TrophyIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { confirmAction } from '@/components/app/confirm'
import { MoneyText } from '@/components/app/MoneyText'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { EmptyRow, Row, RowText, Section } from '@/components/app/Section'
import { ClaimDrawer } from '@/components/group/ClaimDrawer'
import { GroupPinDialog } from '@/components/group/GroupPinDialog'
import { PinDialog } from '@/components/group/PinDialog'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { playerName, plural } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'

function SectionAction({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <Button variant="ghost" className="h-9 gap-1 rounded-xl px-2 text-[15px] font-semibold text-primary-text hover:bg-secondary hover:text-primary-text" onClick={onClick}>
      <PlusIcon className="size-[18px]" strokeWidth={2.4} />
      {children}
    </Button>
  )
}

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const router = useRouter()
  const groupSwr = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const { data: seasons } = useSWR<Season[]>(`/api/seasons?groupId=${groupId}`, swrGetFetcher)
  const { data: players, mutate: mutatePlayers } = useSWR<Player[]>(`/api/players?groupId=${groupId}`, swrGetFetcher)
  const { data: stats } = useSWR<GroupStats>(`/api/groups/${groupId}/stats`, swrGetFetcher)
  const current = seasons?.[0]
  const { data: currentTable } = useSWR<SeasonTableResponse>(current ? `/api/seasons/${current._id}/results` : null, swrGetFetcher)

  const [joinOpen, setJoinOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimTarget, setClaimTarget] = useState<Player | null>(null)
  const [pinOpen, setPinOpen] = useState(false)

  const group = groupSwr.data
  if (!group) {
    return (
      <Page title="Группа">
        <Loader {...groupSwr} />
      </Page>
    )
  }

  const owner = players?.find(p => p._id === group.ownerId)
  const virtualPlayers = players?.filter(p => !p.hasTelegram) ?? []
  const sortedPlayers = [...(players ?? [])].sort((a, b) =>
    (stats?.players[b._id]?.balance ?? 0) - (stats?.players[a._id]?.balance ?? 0) || playerName(a).localeCompare(playerName(b)))
  const leader = currentTable?.players[0]

  const refresh = async () => {
    await groupSwr.mutate()
    await mutatePlayers()
  }

  const join = async (pin: string) => {
    await api.put(`/api/groups/${groupId}/join`, { pin })
    toast.success('Вы вступили в группу')
    await refresh()
  }

  const claim = async (pin: string) => {
    if (!claimTarget) {
      return
    }
    await api.put(`/api/players/${claimTarget._id}/claim`, { groupId, pin })
    toast.success(`Профиль «${playerName(claimTarget)}» теперь ваш`)
    setClaimTarget(null)
    await refresh()
  }

  const leave = async () => {
    if (!await confirmAction({ title: 'Покинуть группу?', description: 'Ваши игры и результаты останутся в истории группы.', confirmText: 'Покинуть' })) {
      return
    }
    try {
      await api.put(`/api/groups/${groupId}/leave`)
      toast.success('Вы покинули группу')
      router.replace('/groups')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const deleteGroup = async () => {
    if (!await confirmAction({ title: 'Удалить группу?', description: 'Вместе с группой удалятся все её сезоны и игры. Это нельзя отменить.', confirmText: 'Удалить' })) {
      return
    }
    try {
      await api.delete(`/api/groups/${groupId}`)
      toast.success('Группа удалена')
      router.replace('/groups')
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const menu = (group.can.delete || group.can.leave)
    ? (
        <>
          {group.can.delete && (
            <DropdownMenuItem onSelect={() => setPinOpen(true)}>
              <KeyRoundIcon />
              PIN группы
            </DropdownMenuItem>
          )}
          {group.can.leave && (
            <DropdownMenuItem variant="destructive" onSelect={leave}>
              <LogOutIcon />
              Покинуть группу
            </DropdownMenuItem>
          )}
          {group.can.delete && (
            <DropdownMenuItem variant="destructive" onSelect={deleteGroup}>
              <Trash2Icon />
              Удалить группу
            </DropdownMenuItem>
          )}
        </>
      )
    : undefined

  return (
    <Page
      title={group.title}
      subtitle={[plural(group.members.length, ['участник', 'участника', 'участников']), owner && `владелец ${playerName(owner)}`].filter(Boolean).join(' · ')}
      menu={menu}
    >
      {group.can.join && (
        <div className="mx-4 rounded-2xl bg-secondary px-4 py-3.5 text-[15px] text-secondary-foreground">
          Вы не состоите в группе. Вступите по PIN от владельца
          {virtualPlayers.length > 0 && ' или займите свой профиль, если вас уже добавили'}
          .
        </div>
      )}

      {current && (
        <Section title="Текущий сезон">
          <Link href={`/groups/${groupId}/seasons/${current._id}`} className="flex min-h-14 items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/60">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <TrophyIcon className="size-5" />
            </span>
            <RowText
              title={current.title}
              subtitle={[
                plural(current.gameIds.length, ['игра', 'игры', 'игр']),
                leader && `лидер ${playerName(leader)}`,
              ].filter(Boolean).join(' · ')}
            />
            {leader && <MoneyText value={currentTable?.totals[leader._id] ?? 0} />}
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        </Section>
      )}

      <Section
        title="Сезоны"
        action={group.can.manage && <SectionAction onClick={() => router.push(`/groups/${groupId}/seasons/new`)}>Новый</SectionAction>}
      >
        {!seasons && <Loader data={null} isLoading error={null} />}
        {seasons?.length === 0 && <EmptyRow>Сезонов пока нет</EmptyRow>}
        {seasons?.map(season => (
          <Row key={season._id} onClick={() => router.push(`/groups/${groupId}/seasons/${season._id}`)}>
            <RowText title={season.title} subtitle={plural(season.gameIds.length, ['игра', 'игры', 'игр'])} />
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </Row>
        ))}
      </Section>

      <Section
        title={players ? `Игроки · ${players.length}` : 'Игроки'}
        action={group.can.manage && <SectionAction onClick={() => router.push(`/groups/${groupId}/players/new`)}>Добавить</SectionAction>}
        footer={stats && stats.games > 0 ? `Итоги за все сезоны, ${plural(stats.games, ['игра', 'игры', 'игр'])}` : undefined}
      >
        {!players && <Loader data={null} isLoading error={null} />}
        {sortedPlayers.map((player) => {
          const s = stats?.players[player._id]
          return (
            <Row key={player._id} onClick={() => router.push(`/players/${player._id}`)}>
              <PlayerAvatar player={player} />
              <RowText
                title={(
                  <span className="inline-flex items-center gap-1.5">
                    {playerName(player)}
                    {player._id === group.ownerId && <CrownIcon className="size-4 text-gold" aria-label="Владелец" />}
                  </span>
                )}
                subtitle={[
                  s ? plural(s.games, ['игра', 'игры', 'игр']) : 'ещё не играл(а)',
                  s?.finalWins && `финалов выиграно: ${s.finalWins}`,
                  !player.hasTelegram && 'без Telegram',
                ].filter(Boolean).join(' · ')}
              />
              {s && <MoneyText value={s.balance} />}
            </Row>
          )
        })}
      </Section>

      <ActionBar>
        {group.can.join && <ActionButton onClick={() => setJoinOpen(true)}>Вступить в группу</ActionButton>}
        {group.can.join && virtualPlayers.length > 0 && (
          <ActionButton variant="secondary" onClick={() => setClaimOpen(true)}>Это я — занять профиль</ActionButton>
        )}
        {group.can.manage && current && (
          <ActionButton onClick={() => router.push(`/groups/${groupId}/seasons/${current._id}/games/new`)}>Новая игра</ActionButton>
        )}
        {group.can.manage && seasons?.length === 0 && (
          <ActionButton onClick={() => router.push(`/groups/${groupId}/seasons/new`)}>Начать сезон</ActionButton>
        )}
      </ActionBar>

      <PinDialog open={joinOpen} onOpenChange={setJoinOpen} title="Вступить в группу" description="Введите PIN группы — его знает владелец" onSubmit={join} />
      <ClaimDrawer
        open={claimOpen}
        onOpenChange={setClaimOpen}
        players={virtualPlayers}
        onSelect={(player) => {
          setClaimOpen(false)
          setClaimTarget(player)
        }}
      />
      <PinDialog
        open={!!claimTarget}
        onOpenChange={open => !open && setClaimTarget(null)}
        title="Занять профиль"
        description={claimTarget ? `Введите PIN группы, чтобы забрать профиль «${playerName(claimTarget)}»` : undefined}
        onSubmit={claim}
      />
      {group.can.delete && <GroupPinDialog open={pinOpen} onOpenChange={setPinOpen} groupId={groupId} />}
    </Page>
  )
}
