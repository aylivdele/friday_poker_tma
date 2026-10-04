'use client'

import type { GameDetails, Player } from '@/types/api'
import { TrophyIcon } from 'lucide-react'
import { ActionBar, ActionButton } from '@/components/ActionBar/ActionBar'
import { MoneyText } from '@/components/app/MoneyText'
import { PlayerAvatar } from '@/components/app/PlayerAvatar'
import { Row, RowText, Section } from '@/components/app/Section'
import { calcGameBalances, getGameWinners, playerCost } from '@/domain/balances'
import { formatDateTime, formatMoney, playerName } from '@/lib/format'
import { settingsSummary } from './SettingsFields'

// Итоги завершённой игры: все участники, от большего выигрыша к большему проигрышу
export function FinishedGame({ game, playersById, onCorrect }: {
  game: GameDetails
  playersById: Map<string, Player>
  onCorrect: () => void
}) {
  const balances = calcGameBalances(game)
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

      {game.can.edit && (
        <ActionBar>
          <ActionButton variant="secondary" onClick={onCorrect}>Исправить итоги</ActionButton>
        </ActionBar>
      )}
    </>
  )
}
