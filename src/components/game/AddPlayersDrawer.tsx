'use client'

import type { GameDetails, Player } from '@/types/api'
import { PlusIcon } from 'lucide-react'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { EmptyRow, Row, RowText } from '@/components/app/Section'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { playerName, plural } from '@/lib/format'

// Участники группы, которых ещё нет в игре. Можно добавить нескольких подряд.
export function AddPlayersDrawer({ open, onOpenChange, game, groupPlayers, onAdd }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: GameDetails
  groupPlayers: Player[]
  onAdd: (playerId: string) => void
}) {
  const candidates = groupPlayers
    .filter(p => !game.players.some(gp => gp.playerId === p._id))
    .map(p => ({ player: p, cap: game.caps[p._id] ?? 0 }))
    .sort((a, b) => Number(b.cap > 0) - Number(a.cap > 0) || playerName(a.player).localeCompare(playerName(b.player)))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Добавить игроков</DrawerTitle>
          {game.settings.isFinal && (
            <DrawerDescription>В финале число входов зависит от того, сколько игрок сыграл за сезон</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="min-h-0 flex-1 divide-y overflow-y-auto">
          {candidates.length === 0 && <EmptyRow>Все участники группы уже в игре</EmptyRow>}
          {candidates.map(({ player, cap }) => (
            <Row key={player._id} className={cap === 0 ? 'opacity-60' : undefined}>
              <PlayerAvatar player={player} />
              <RowText
                title={playerName(player)}
                subtitle={cap > 0 ? `Доступно ${plural(cap, ['вход', 'входа', 'входов'])}` : 'Не проходит в финал: мало игр за сезон'}
              />
              {cap > 0 && (
                <Button variant="secondary" className="h-10 rounded-xl" aria-label={`Добавить: ${playerName(player)}`} onClick={() => onAdd(player._id)}>
                  <PlusIcon className="size-4" />
                  Добавить
                </Button>
              )}
            </Row>
          ))}
        </div>
        <DrawerFooter>
          <Button size="lg" className="h-12 rounded-xl text-base" onClick={() => onOpenChange(false)}>Готово</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
