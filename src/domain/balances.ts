// Чистая логика расчёта денег по игре. Работает и с ObjectId, и со строковыми id.

interface Id { toString: () => string }

export interface BalanceGame {
  players: { playerId: Id, entries: number }[]
  results?: { playerId: Id, score: number }[]
  settings: { isFinal: boolean, firstEntryCost: number, reEntryCost: number, maxReEntries: number }
}

export function totalStacks(game: Pick<BalanceGame, 'players'>) {
  return game.players.reduce((acc, p) => acc + 1 + p.entries, 0)
}

export function playerCost(game: Pick<BalanceGame, 'settings'>, entries: number) {
  return game.settings.firstEntryCost + entries * game.settings.reEntryCost
}

export function gameBank(game: Pick<BalanceGame, 'players' | 'settings'>) {
  return game.players.reduce((acc, p) => acc + playerCost(game, p.entries), 0)
}

// Банк делится между призёрами пропорционально их стекам, поэтому сумма балансов за игру всегда 0
export function calcGameBalances(game: BalanceGame): Record<string, number> {
  const balances: Record<string, number> = {}
  const stacks = totalStacks(game)
  const bank = gameBank(game)

  for (const p of game.players) {
    const playerId = p.playerId.toString()
    balances[playerId] = (balances[playerId] ?? 0) - playerCost(game, p.entries)
  }

  if (stacks > 0) {
    for (const r of game.results ?? []) {
      const playerId = r.playerId.toString()
      balances[playerId] = (balances[playerId] ?? 0) + bank * r.score / stacks
    }
  }

  return balances
}

export function getGameWinners(game: BalanceGame): string[] {
  let max = -Infinity
  let winners: string[] = []

  for (const [playerId, value] of Object.entries(calcGameBalances(game))) {
    if (value > max) {
      max = value
      winners = [playerId]
    }
    else if (value === max) {
      winners.push(playerId)
    }
  }

  return winners
}

// Доля входов игрока за обычные игры сезона: от неё зависит, сколько входов ему доступно в финале.
// Призёр игры получает максимум входов этой игры.
export function calcSeasonEntryShares(regularGames: BalanceGame[]): Record<string, number> {
  let maxSeasonEntries = 0
  const seasonEntries: Record<string, number> = {}

  for (const game of regularGames) {
    if (game.settings.isFinal) {
      continue
    }
    maxSeasonEntries += game.settings.maxReEntries + 1
    for (const p of game.players) {
      const playerId = p.playerId.toString()
      const isPrizeWinner = game.results?.some(r => r.playerId.toString() === playerId)
      const entries = isPrizeWinner ? game.settings.maxReEntries + 1 : 1 + p.entries
      seasonEntries[playerId] = (seasonEntries[playerId] ?? 0) + entries
    }
  }

  if (maxSeasonEntries === 0) {
    return {}
  }
  return Object.fromEntries(Object.entries(seasonEntries).map(([playerId, entries]) => [playerId, entries / maxSeasonEntries]))
}

// Сколько всего входов (первый + повторные) может сделать игрок в этой игре
export function calcEntryCaps(game: Pick<BalanceGame, 'settings'>, playerIds: string[], finishedSeasonGames: BalanceGame[]): Record<string, number> {
  const maxEntries = game.settings.maxReEntries + 1
  const regularGames = finishedSeasonGames.filter(g => !g.settings.isFinal)

  if (!game.settings.isFinal || regularGames.length === 0) {
    return Object.fromEntries(playerIds.map(id => [id, maxEntries]))
  }

  const shares = calcSeasonEntryShares(regularGames)
  return Object.fromEntries(playerIds.map(id => [id, Math.floor(maxEntries * (shares[id] ?? 0))]))
}
