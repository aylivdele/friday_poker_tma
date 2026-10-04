'use client'

import type { CurrentSeason, FinishedGamesPage, GameListItem } from '@/types/api'
import { ChevronRightIcon, Loader2Icon, PlusIcon, SpadeIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Row, RowText, Section } from '@/components/app/Section'
import { TabHeader } from '@/components/app/TabHeader'
import { GameRow } from '@/components/game/GameRow'
import { Loader } from '@/components/Loader/Loader'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { plural } from '@/lib/format'
import { swrGetFetcher } from '@/lib/swrFetcher'
import { usePlayerStore } from '@/stores/playerStore'

const contextOf = (game: GameListItem) => [game.groupTitle, game.seasonTitle].filter(Boolean).join(' · ')

export default function GamesPage() {
  const router = useRouter()
  const me = usePlayerStore(s => s.player)
  const [pickSeason, setPickSeason] = useState(false)

  const live = useSWR<GameListItem[]>('/api/games?scope=live', swrGetFetcher, { refreshInterval: 15000 })
  const finished = useSWRInfinite<FinishedGamesPage>(
    (index, previous) => index === 0 ? '/api/games?scope=finished' : previous?.nextCursor ? `/api/games?scope=finished&cursor=${previous.nextCursor}` : null,
    swrGetFetcher,
  )
  const { data: seasons } = useSWR<CurrentSeason[]>('/api/seasons?scope=current', swrGetFetcher)

  const finishedGames = finished.data?.flatMap(page => page.items) ?? []
  const hasMore = !!finished.data?.at(-1)?.nextCursor
  const loading = !live.data || !finished.data
  const empty = !loading && live.data?.length === 0 && finishedGames.length === 0
  const creatable = seasons?.filter(s => s.can.createGame) ?? []

  const newGame = () => {
    if (creatable.length === 1) {
      router.push(`/groups/${creatable[0].groupId}/seasons/${creatable[0]._id}/games/new`)
    }
    else {
      setPickSeason(true)
    }
  }

  return (
    <Page back={false}>
      <TabHeader
        title="Игры"
        action={creatable.length > 0 && (
          <Button size="icon" variant="secondary" className="size-11 rounded-full" aria-label="Новая игра" onClick={newGame}>
            <PlusIcon className="size-[22px]" strokeWidth={2.4} />
          </Button>
        )}
      />

      {loading && <Loader data={null} isLoading error={live.error ?? finished.error} />}

      {empty && (
        <div className="flex flex-col items-center gap-3 px-8 pt-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <SpadeIcon className="size-7" />
          </span>
          <p className="text-lg font-semibold">Здесь появятся ваши игры</p>
          <p className="text-sm text-muted-foreground">Вступите в группу друзей или создайте свою, чтобы начать первый сезон</p>
          <Button size="lg" className="mt-2 h-11 rounded-xl px-5 text-base" onClick={() => router.push('/groups')}>К группам</Button>
        </div>
      )}

      {!!live.data?.length && (
        <Section title="Идут сейчас">
          {live.data.map(game => <GameRow key={game._id} game={game} meId={me?._id} meta={contextOf(game)} />)}
        </Section>
      )}

      {finishedGames.length > 0 && (
        <Section title="Недавние">
          {finishedGames.map(game => <GameRow key={game._id} game={game} meId={me?._id} meta={contextOf(game)} />)}
        </Section>
      )}

      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button variant="ghost" className="h-10 rounded-xl text-primary-text hover:bg-secondary hover:text-primary-text" disabled={finished.isValidating} onClick={() => finished.setSize(finished.size + 1)}>
            {finished.isValidating && <Loader2Icon className="size-4 animate-spin" />}
            Показать ещё
          </Button>
        </div>
      )}

      <Drawer open={pickSeason} onOpenChange={setPickSeason}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Новая игра</DrawerTitle>
            <DrawerDescription>В каком сезоне?</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 divide-y overflow-y-auto border-t">
            {creatable.map(season => (
              <Row key={season._id} onClick={() => router.push(`/groups/${season.groupId}/seasons/${season._id}/games/new`)}>
                <RowText title={season.title} subtitle={`${season.groupTitle} · ${plural(season.gameIds.length, ['игра', 'игры', 'игр'])}`} />
                <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
              </Row>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </Page>
  )
}
