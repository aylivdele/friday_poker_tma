'use client'

import type { Game, Player, SeasonTableResponse } from '@/types/api'
import { TrophyIcon } from 'lucide-react'
import { useState } from 'react'
import { MoneyText } from '@/components/app/MoneyText'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText, Section } from '@/components/app/Section'
import { FinalBadge } from '@/components/game/GameRow'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { formatShortDate, playerName, plural } from '@/lib/format'
import { cn } from '@/lib/utils'

const MEDALS = ['bg-gold-soft text-gold', 'bg-silver-soft text-silver', 'bg-bronze-soft text-bronze']

function Place({ place }: { place: number }) {
  return (
    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums', MEDALS[place - 1] ?? 'text-muted-foreground')}>
      {place}
    </span>
  )
}

// Рейтинг сезона: место, игрок, сыгранные игры, доля входов и итог в рублях
export function SeasonRanking({ table, games }: { table: SeasonTableResponse, games?: Game[] }) {
  const [selected, setSelected] = useState<Player | null>(null)
  const winners = new Set(table.finalWinners)
  const gameById = new Map((games ?? []).map(g => [g._id, g]))

  return (
    <>
      <Section>
        {table.players.map((player, index) => {
          const played = Object.keys(table.cells[player._id] ?? {}).length
          const share = table.seasonEntries[player._id]
          return (
            <Row key={player._id} className="gap-2.5" onClick={() => setSelected(player)}>
              <Place place={index + 1} />
              <PlayerAvatar player={player} className="size-9" />
              <RowText
                title={(
                  <span className="inline-flex items-center gap-1.5">
                    {playerName(player)}
                    {winners.has(player._id) && <TrophyIcon className="size-4 text-gold" aria-label="Победитель финала" />}
                  </span>
                )}
                subtitle={[plural(played, ['игра', 'игры', 'игр']), share !== undefined && `входы ${Math.round(share * 100)}%`].filter(Boolean).join(' · ')}
              />
              <MoneyText value={table.totals[player._id] ?? 0} />
            </Row>
          )
        })}
      </Section>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-gold bg-gold-soft" />
          места в сезоне
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrophyIcon className="size-3.5 text-gold" />
          победитель финала
        </span>
        <span>входы — доля от возможных; от неё зависит лимит в финале</span>
      </div>

      <Drawer open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{playerName(selected)}</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 flex-1 divide-y overflow-y-auto border-y">
            {selected && table.games
              .filter(g => table.cells[selected._id]?.[g._id] !== undefined)
              .map((g) => {
                const game = gameById.get(g._id)
                return (
                  <Row key={g._id}>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-base font-medium">
                        <span className="truncate">{g.title || 'Игра'}</span>
                        {g.isFinal && <FinalBadge />}
                      </span>
                      {game && <span className="text-[13px] text-muted-foreground">{formatShortDate(game.createdAt)}</span>}
                    </div>
                    <MoneyText value={table.cells[selected._id][g._id]} />
                  </Row>
                )
              })}
          </div>
          {selected && (
            <div className="flex items-center justify-between px-4 py-4 text-base font-semibold">
              <span>Итого за сезон</span>
              <MoneyText value={table.totals[selected._id] ?? 0} />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

// Подробная таблица: все игры по столбцам, имена закреплены слева
export function SeasonGrid({ table }: { table: SeasonTableResponse }) {
  return (
    <section className="px-4 pt-5">
      <div className="overflow-x-auto rounded-2xl bg-card">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="sticky left-0 z-1 bg-card px-3 py-2.5 font-semibold">Игрок</th>
              {table.games.map(g => (
                <th key={g._id} className="max-w-28 truncate px-3 py-2.5 text-right font-semibold" title={g.title}>
                  {g.isFinal && <TrophyIcon className="mr-1 inline size-3.5 text-gold" />}
                  {g.title || 'Игра'}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold text-foreground">Итого</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {table.players.map(player => (
              <tr key={player._id}>
                <td className="sticky left-0 z-1 max-w-32 truncate bg-card px-3 py-2.5 font-medium">{playerName(player)}</td>
                {table.games.map((g) => {
                  const value = table.cells[player._id]?.[g._id]
                  return (
                    <td key={g._id} className="px-3 py-2.5 text-right">
                      {value === undefined ? <span className="text-muted-foreground">—</span> : <MoneyText value={value} className="font-medium" />}
                    </td>
                  )
                })}
                <td className="bg-muted/50 px-3 py-2.5 text-right"><MoneyText value={table.totals[player._id] ?? 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
