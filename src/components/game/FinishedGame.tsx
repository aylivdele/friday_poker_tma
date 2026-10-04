'use client'

import type { GameDetails, Player } from '@/types/api'
import { ArrowRightIcon, PiggyBankIcon, TrophyIcon } from 'lucide-react'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { MoneyText } from '@/components/app/MoneyText'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText, Section } from '@/components/app/Section'
import { getGameWinners, playerCost } from '@/domain/balances'
import { gameSettlement, PRIZE_FUND } from '@/domain/settlement'
import { formatDateTime, formatMoney, playerName, shortPlayerName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import { settingsSummary } from './SettingsFields'

// Итоги завершённой игры: все участники, от большего выигрыша к большему проигрышу
export function FinishedGame({ game, playersById, onCorrect }: {
  game: GameDetails
  playersById: Map<string, Player>
  onCorrect: () => void
}) {
  const meId = usePlayerStore(s => s.player?._id)
  // Целые рубли, как в переводах ниже и в сообщениях бота
  const { balances, transfers } = gameSettlement(game)
  const winners = new Set(getGameWinners(game))
  const rows = game.players
    .map(p => ({
      ...p,
      info: playersById.get(p.playerId),
      score: game.results?.find(r => r.playerId === p.playerId)?.score ?? 0,
      balance: balances[p.playerId] ?? 0,
    }))
    .sort((a, b) => b.balance - a.balance)

  const creator = game.creater ? playersById.get(game.creater) : undefined
  const editor = game.updatedBy ? playersById.get(game.updatedBy) : undefined

  return (
    <>
      <Section
        title="Итоги"
        footer={(
          <>
            {settingsSummary(game.settings)}
            {creator && (
              <>
                <br />
                {`Создал(а): ${playerName(creator)}`}
              </>
            )}
            {game.updatedAt && editor && (
              <>
                <br />
                {`Изменено: ${formatDateTime(game.updatedAt)}, ${playerName(editor)}`}
              </>
            )}
          </>
        )}
      >
        {rows.map(row => (
          <Row key={row.playerId}>
            <PlayerAvatar player={row.info} />
            <RowText
              title={(
                <span className="inline-flex items-center gap-1.5">
                  {playerName(row.info)}
                  {winners.has(row.playerId) && row.balance > 0 && <TrophyIcon className="size-4 text-gold" aria-label="Победитель" />}
                </span>
              )}
              subtitle={`Входы ${row.entries + 1} · ${formatMoney(playerCost(game, row.entries))}${row.score ? ` · стеков ${row.score}` : ''}`}
            />
            <MoneyText value={row.balance} />
          </Row>
        ))}
      </Section>

      {transfers.length > 0 && (
        <Section title="Расчёты" footer="Переводов как можно меньше: долг по возможности уходит одному человеку">
          {transfers.map((t) => {
            const fromFund = t.from === PRIZE_FUND
            const from = playersById.get(t.from)
            const to = playersById.get(t.to)
            const mine = t.from === meId || t.to === meId
            return (
              <Row key={`${t.from}-${t.to}`} className={cn(mine && 'bg-secondary/50')}>
                {fromFund
                  ? (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold" aria-hidden>
                        <PiggyBankIcon className="size-5" />
                      </span>
                    )
                  : <PlayerAvatar player={from} />}
                <RowText
                  title={(
                    <span className="inline-flex max-w-full items-center gap-1.5">
                      <span className="truncate">{fromFund ? 'Призовой фонд' : shortPlayerName(from)}</span>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-label="переводит" />
                      <span className="truncate">{shortPlayerName(to)}</span>
                    </span>
                  )}
                  subtitle={t.from === meId ? 'Вы переводите' : t.to === meId ? 'Вам переводят' : undefined}
                />
                <span className="shrink-0 font-semibold tabular-nums">{formatMoney(t.amount)}</span>
              </Row>
            )
          })}
        </Section>
      )}

      {game.can.edit && (
        <ActionBar>
          <ActionButton variant="secondary" onClick={onCorrect}>Исправить итоги</ActionButton>
        </ActionBar>
      )}
    </>
  )
}
