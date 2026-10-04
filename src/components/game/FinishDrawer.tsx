'use client'

import type { GameDetails, Player } from '@/types/api'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText } from '@/components/app/Section'
import { Stepper } from '@/components/app/Stepper'
import { confirmAction } from '@/components/ConfirmButton/ConfirmButton'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Progress } from '@/components/ui/progress'
import { totalStacks } from '@/domain/balances'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { playerName } from '@/lib/format'
import { haptic } from '@/lib/haptics'

type Scores = Record<string, number>

function storageKey(gameId: string) {
  return `fp-finish-${gameId}`
}

function readDraft(gameId: string): Scores {
  try {
    return JSON.parse(window.sessionStorage.getItem(storageKey(gameId)) ?? '{}')
  }
  catch {
    return {}
  }
}

// Распределение стеков между призёрами и завершение игры
export function FinishDrawer({ open, onOpenChange, game, playersById, onFinished }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: GameDetails
  playersById: Map<string, Player>
  onFinished: (game: GameDetails) => void
}) {
  const [scores, setScores] = useState<Scores>(() => readDraft(game._id))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey(game._id), JSON.stringify(scores))
    }
    catch {}
  }, [game._id, scores])

  // Учитываем только тех, кто сейчас в игре: состав могли поменять с другого телефона
  const total = totalStacks(game)
  const scoreOf = (playerId: string) => scores[playerId] ?? 0
  const distributed = game.players.reduce((acc, p) => acc + scoreOf(p.playerId), 0)
  const remaining = total - distributed
  const hint = remaining > 0
    ? `Осталось распределить: ${remaining}`
    : remaining < 0 ? `Распределено на ${-remaining} больше, чем стеков в игре` : null

  const finish = async () => {
    const confirmed = await confirmAction({
      title: 'Завершить игру?',
      description: 'После завершения исправить итоги смогут только создатель игры и владелец группы.',
      confirmText: 'Завершить',
      destructive: false,
    })
    if (!confirmed) {
      return
    }
    setSaving(true)
    try {
      const results = game.players.map(p => ({ playerId: p.playerId, score: scoreOf(p.playerId) })).filter(r => r.score > 0)
      const finished = await api.post<GameDetails>(`/api/games/${game._id}/finish`, { rev: game.rev, results })
      window.sessionStorage.removeItem(storageKey(game._id))
      haptic('success')
      toast.success('Игра завершена')
      onFinished(finished)
      onOpenChange(false)
    }
    catch (e) {
      haptic('error')
      toast.error(getErrorMessage(e))
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle className="text-lg">Итоги игры</DrawerTitle>
          <DrawerDescription>Сколько стеков у каждого в конце игры</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 px-4 pb-3">
          <Progress value={total ? Math.min(100, (distributed / total) * 100) : 0} />
          <p className={remaining === 0 ? 'text-sm font-medium text-gain' : 'text-sm text-muted-foreground'}>
            {remaining === 0 ? `Все ${total} стеков распределены` : `Распределено ${distributed} из ${total}`}
          </p>
        </div>

        <div className="min-h-0 flex-1 divide-y overflow-y-auto border-y">
          {game.players.map((p) => {
            const info = playersById.get(p.playerId)
            const score = scoreOf(p.playerId)
            return (
              <Row key={p.playerId}>
                <PlayerAvatar player={info} />
                <RowText title={playerName(info)} subtitle={`Входы: ${p.entries + 1}`} />
                {remaining > 0 && (
                  <Button variant="ghost" className="h-10 rounded-xl px-2 text-primary-text" onClick={() => setScores({ ...scores, [p.playerId]: score + remaining })}>
                    +
                    {remaining}
                  </Button>
                )}
                <Stepper
                  label={`стеки ${playerName(info)}`}
                  value={score}
                  max={Math.max(score, score + remaining)}
                  onChange={value => setScores({ ...scores, [p.playerId]: value })}
                />
              </Row>
            )
          })}
        </div>

        <DrawerFooter>
          {hint && <p className="text-center text-sm text-muted-foreground">{hint}</p>}
          <Button size="lg" className="h-12 rounded-xl text-base font-semibold" disabled={remaining !== 0 || distributed === 0 || saving} onClick={finish}>
            {saving && <Loader2Icon className="size-5 animate-spin" />}
            Завершить игру
          </Button>
          {distributed > 0 && (
            <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => setScores({})}>Сбросить</Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
