'use client'

import type { GameOp } from '@/domain/gameOps'
import type { GameDetails, GameSettings, Player } from '@/types/api'
import { ChevronRightIcon, EllipsisVerticalIcon, PlusIcon, SlidersHorizontalIcon, UserMinusIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ActionBar, ActionButton, ActionHint } from '@/components/ActionBar/ActionBar'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { EmptyRow, Row, RowText, Section } from '@/components/app/Section'
import { Stepper } from '@/components/app/Stepper'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { playerName, plural } from '@/lib/format'
import { AddPlayersDrawer } from './AddPlayersDrawer'
import { FinishDrawer } from './FinishDrawer'
import { SettingsFields, settingsSummary } from './SettingsFields'

const SETTINGS_DEBOUNCE_MS = 700

// Идущая игра: всё сохраняется автоматически
export function LiveGame({ game, groupPlayers, playersById, sendOps, onFinished }: {
  game: GameDetails
  groupPlayers: Player[]
  playersById: Map<string, Player>
  sendOps: (ops: GameOp[]) => boolean
  onFinished: (game: GameDetails) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const canEdit = game.can.edit

  // Числа в настройках сохраняем, когда пользователь перестал печатать
  const pendingSettings = useRef<Partial<GameSettings>>({})
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flushSettings = () => {
    clearTimeout(timer.current)
    const patch = pendingSettings.current
    pendingSettings.current = {}
    if (Object.keys(patch).length > 0) {
      sendOps([{ type: 'setSettings', settings: patch }])
    }
  }
  useEffect(() => () => flushSettings(), [])

  const changeSettings = (patch: Partial<GameSettings>) => {
    if ('isFinal' in patch) {
      flushSettings()
      sendOps([{ type: 'setSettings', settings: patch }])
      return
    }
    pendingSettings.current = { ...pendingSettings.current, ...patch }
    clearTimeout(timer.current)
    timer.current = setTimeout(flushSettings, SETTINGS_DEBOUNCE_MS)
  }

  const removePlayer = (playerId: string, entries: number) => {
    const name = playerName(playersById.get(playerId))
    if (sendOps([{ type: 'removePlayer', playerId }])) {
      toast(`${name} убран(а) из игры`, {
        action: {
          label: 'Вернуть',
          onClick: () => sendOps([{ type: 'addPlayer', playerId }, { type: 'setEntries', playerId, from: 0, to: entries }]),
        },
      })
    }
  }

  return (
    <>
      <Section
        title={`Игроки · ${game.players.length}`}
        action={canEdit && (
          <Button variant="ghost" className="h-9 gap-1 rounded-xl px-2 text-[15px] font-semibold text-primary-text hover:bg-secondary hover:text-primary-text" onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-[18px]" strokeWidth={2.4} />
            Добавить
          </Button>
        )}
      >
        {game.players.length === 0 && <EmptyRow>Добавьте игроков, которые сели за стол</EmptyRow>}
        {game.players.map((p) => {
          const info = playersById.get(p.playerId)
          const cap = game.caps[p.playerId] ?? game.settings.maxReEntries + 1
          return (
            <Row key={p.playerId} className="gap-2.5 pr-1.5">
              <PlayerAvatar player={info} />
              <RowText title={playerName(info)} subtitle={`Входы ${p.entries + 1} из ${cap}`} />
              {canEdit
                ? (
                    <>
                      <Stepper
                        label={`входы ${playerName(info)}`}
                        value={p.entries + 1}
                        min={1}
                        max={Math.max(cap, p.entries + 1)}
                        onChange={total => sendOps([{ type: 'setEntries', playerId: p.playerId, from: p.entries, to: total - 1 }])}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground" aria-label={`Ещё: ${playerName(info)}`}>
                            <EllipsisVerticalIcon className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem variant="destructive" onSelect={() => removePlayer(p.playerId, p.entries)}>
                            <UserMinusIcon />
                            Убрать из игры
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )
                : <span className="pr-2 text-[17px] font-semibold tabular-nums">{p.entries + 1}</span>}
            </Row>
          )
        })}
      </Section>

      <Section>
        <Row onClick={() => setSettingsOpen(true)}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <SlidersHorizontalIcon className="size-5" />
          </span>
          <RowText
            title={game.settings.isFinal ? 'Настройки · финал' : 'Настройки игры'}
            subtitle={settingsSummary(game.settings)}
          />
          <ChevronRightIcon className="size-5 text-muted-foreground" />
        </Row>
      </Section>

      <AddPlayersDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        game={game}
        groupPlayers={groupPlayers}
        onAdd={playerId => sendOps([{ type: 'addPlayer', playerId }])}
      />

      <Drawer
        open={settingsOpen}
        onOpenChange={(open) => {
          if (!open) {
            flushSettings()
          }
          setSettingsOpen(open)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Настройки игры</DrawerTitle>
          </DrawerHeader>
          <div className="mx-4 overflow-hidden rounded-2xl border">
            <SettingsFields settings={game.settings} onChange={changeSettings} disabled={!canEdit} />
          </div>
          <DrawerFooter>
            <Button
              size="lg"
              className="h-12 rounded-xl text-base"
              onClick={() => {
                flushSettings()
                setSettingsOpen(false)
              }}
            >
              Готово
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <FinishDrawer open={finishOpen} onOpenChange={setFinishOpen} game={game} playersById={playersById} onFinished={onFinished} />

      {game.can.finish && (
        <ActionBar>
          {game.players.length < 2 && <ActionHint>{`Чтобы завершить игру, нужно хотя бы ${plural(2, ['игрок', 'игрока', 'игроков'])}`}</ActionHint>}
          <ActionButton disabled={game.players.length < 2} onClick={() => setFinishOpen(true)}>Завершить игру</ActionButton>
        </ActionBar>
      )}
    </>
  )
}
