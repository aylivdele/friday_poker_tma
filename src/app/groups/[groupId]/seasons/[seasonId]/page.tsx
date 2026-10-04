'use client'

import type { Game, Group, Season, SeasonTableResponse } from '@/types/api'
import { PiggyBankIcon, Rows3Icon, Table2Icon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { confirmAction } from '@/components/app/confirm'
import { Row, RowText, Section } from '@/components/app/Section'
import { Segmented } from '@/components/app/Segmented'
import { GameRow } from '@/components/game/GameRow'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { SeasonGrid, SeasonRanking } from '@/components/season/SeasonRanking'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { seasonFundCollected } from '@/domain/balances'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney, plural } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'

type Tab = 'table' | 'games'

export default function SeasonPage({ params }: { params: Promise<{ seasonId: string, groupId: string }> }) {
  const { seasonId, groupId } = use(params)
  const router = useRouter()
  const me = usePlayerStore(s => s.player)
  const seasonSwr = useSWR<Season>(`/api/seasons/${seasonId}`, swrGetFetcher)
  const { data: group } = useSWR<Group>(`/api/groups/${groupId}`, swrGetFetcher)
  const gamesSwr = useSWR<Game[]>(`/api/games?seasonId=${seasonId}`, swrGetFetcher)
  const tableSwr = useSWR<SeasonTableResponse>(`/api/seasons/${seasonId}/results`, swrGetFetcher)
  const [tab, setTab] = useState<Tab | null>(null)
  const [detailed, setDetailed] = useState(false)

  const season = seasonSwr.data
  const games = gamesSwr.data
  const table = tableSwr.data
  const fundCollected = games ? Math.round(seasonFundCollected(games)) : 0
  const playedFinal = games?.find(g => g.settings.isFinal && g.isFinished)

  // По умолчанию — таблица, если уже есть сыгранные игры
  useEffect(() => {
    if (tab === null && games) {
      setTab(games.some(g => g.isFinished) ? 'table' : 'games')
    }
  }, [games, tab])

  if (!season) {
    return (
      <Page title="Сезон">
        <Loader {...seasonSwr} />
      </Page>
    )
  }

  const deleteSeason = async () => {
    const count = season.gameIds.length
    const confirmed = await confirmAction({
      title: 'Удалить сезон?',
      description: count > 0 ? `Вместе с сезоном удалятся все его игры (${count}). Это нельзя отменить.` : 'Это нельзя отменить.',
      confirmText: 'Удалить',
    })
    if (!confirmed) {
      return
    }
    try {
      await api.delete(`/api/seasons/${seasonId}`)
      toast.success('Сезон удалён')
      router.replace(`/groups/${groupId}`)
    }
    catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Page
      title={season.title}
      subtitle={group ? `${group.title} · ${plural(games?.length ?? season.gameIds.length, ['игра', 'игры', 'игр'])}` : undefined}
      menu={season.can.delete
        ? (
            <DropdownMenuItem variant="destructive" onSelect={deleteSeason}>
              <Trash2Icon />
              Удалить сезон
            </DropdownMenuItem>
          )
        : undefined}
    >
      <Segmented
        value={tab ?? 'table'}
        onChange={setTab}
        options={[
          { value: 'table', label: 'Таблица' },
          { value: 'games', label: games ? `Игры · ${games.length}` : 'Игры' },
        ]}
      />

      {fundCollected > 0 && (
        <Section>
          <Row>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold" aria-hidden>
              <PiggyBankIcon className="size-5" />
            </span>
            <RowText
              title="Призовой фонд"
              subtitle={playedFinal?.settings.prizeFund ? `Собрано за сезон · в финале разыграно ${formatMoney(playedFinal.settings.prizeFund)}` : 'Собрано за сезон, разыгрывается в финале'}
            />
            <span className="shrink-0 font-semibold tabular-nums">{formatMoney(fundCollected)}</span>
          </Row>
        </Section>
      )}

      {tab === 'games' && (
        !games
          ? <Loader {...gamesSwr} />
          : (
              <Section>
                {games.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Игр пока нет — создайте первую</div>}
                {games.map(game => <GameRow key={game._id} game={game} meId={me?._id} />)}
              </Section>
            )
      )}

      {tab === 'table' && (
        !table
          ? <Loader {...tableSwr} />
          : table.players.length === 0
            ? <div className="px-6 py-10 text-center text-sm text-muted-foreground">Таблица появится после первой завершённой игры</div>
            : (
                <>
                  {detailed ? <SeasonGrid table={table} /> : <SeasonRanking table={table} games={games} />}
                  <div className="flex justify-center pt-3">
                    <Button variant="ghost" className="h-10 gap-2 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" onClick={() => setDetailed(!detailed)}>
                      {detailed ? <Rows3Icon className="size-4" /> : <Table2Icon className="size-4" />}
                      {detailed ? 'Рейтинг' : 'Подробно по играм'}
                    </Button>
                  </div>
                </>
              )
      )}

      {season.can.createGame && (
        <ActionBar>
          <ActionButton onClick={() => router.push(`/groups/${groupId}/seasons/${seasonId}/games/new`)}>Новая игра</ActionButton>
        </ActionBar>
      )}
    </Page>
  )
}
