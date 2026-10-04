'use client'

import type { Player } from '@/types/api'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText } from '@/components/app/Section'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { playerName } from '@/lib/format'

// Выбор своего профиля среди игроков без Telegram
export function ClaimDrawer({ open, onOpenChange, players, onSelect }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: Player[]
  onSelect: (player: Player) => void
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Какой профиль ваш?</DrawerTitle>
          <DrawerDescription>Его игры и результаты перейдут к вам</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 divide-y overflow-y-auto border-t">
          {players.map(player => (
            <Row key={player._id} onClick={() => onSelect(player)}>
              <PlayerAvatar player={player} />
              <RowText title={playerName(player)} subtitle="Профиль без Telegram" />
            </Row>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
