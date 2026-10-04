import type { ObjectId, WithId } from 'mongodb'
import type { InlineButton } from './telegramBot'
import type { Game } from '@/types/db'
import process from 'node:process'
import { getDb } from '@/core/db'
import { getGameWinners, prizeFund } from '@/domain/balances'
import { gameSettlement } from '@/domain/settlement'
import { telegramGameLink } from '@/lib/links'
import { buildResultsMessage } from './resultsMessage'
import { sendTelegramMessage } from './telegramBot'

// Кнопка под сообщением: через мини-приложение, а без его адреса — сайт, открытый как мини-приложение
function gameButton(gameId: ObjectId): InlineButton | undefined {
  const appUrl = process.env.TELEGRAM_APP_URL
  if (appUrl) {
    return { text: 'Открыть игру', url: telegramGameLink(appUrl, gameId.toString()) }
  }
  const origin = process.env.APP_ORIGIN
  return origin ? { text: 'Открыть игру', web_app: { url: `${origin}/games/${gameId}` } } : undefined
}

// Переводы по игре; по ним же решаем, изменились ли расчёты после исправления
export function gameTransfers(game: Pick<Game, 'players' | 'results' | 'settings'>) {
  return gameSettlement(game).transfers
}

/*
 * Рассылает итоги игры участникам из Telegram, кроме отключивших уведомления.
 * Заодно запоминает, может ли бот писать человеку, — это видно в профиле.
 */
export async function notifyGameResults(game: WithId<Game>, { corrected = false } = {}) {
  if (!game.isFinished) {
    return
  }
  const db = await getDb()
  const [group, season, players] = await Promise.all([
    db.groups.findOne({ _id: game.groupId }, { projection: { title: 1 } }),
    game.seasonId ? db.seasons.findOne({ _id: game.seasonId }, { projection: { title: 1 } }) : null,
    db.players.find({ _id: { $in: game.players.map(p => p.playerId) } }).toArray(),
  ])

  const { balances, transfers } = gameSettlement(game)
  const common = {
    title: game.title,
    date: game.createdAt,
    groupTitle: group?.title ?? '',
    seasonTitle: season?.title,
    corrected,
    players: new Map(players.map(p => [p._id.toString(), p])),
    balances,
    transfers,
    winners: getGameWinners(game),
    prizeFund: prizeFund(game),
  }
  const button = gameButton(game._id)

  for (const player of players) {
    if (player.telegramId == null || player.notifyGames === false) {
      continue
    }
    const text = buildResultsMessage({ ...common, recipientId: player._id.toString() })
    const result = await sendTelegramMessage(player.telegramId, text, button)
    if (result !== 'failed' && player.botCanWrite !== (result === 'sent')) {
      await db.players.updateOne({ _id: player._id }, { $set: { botCanWrite: result === 'sent' } })
    }
  }
}
