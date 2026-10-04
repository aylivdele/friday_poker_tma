// Чистая логика расчёта денег по игре. Работает и с ObjectId, и со строковыми id.

interface Id { toString: () => string }

export interface BalanceGame {
  players: { playerId: Id, entries: number }[]
  results?: { playerId: Id, score: number }[]
  settings: {
    isFinal: boolean
    firstEntryCost: number
    reEntryCost: number
    maxReEntries: number
    prizeFund?: number
    fundPercent?: number
  }
}

// Сколько процентов выплаты по стекам уходит в призовой фонд финала, если в игре не указано иное
export const DEFAULT_FUND_PERCENT = 10

export function totalStacks(game: Pick<BalanceGame, 'players'>) {
  return game.players.reduce((acc, p) => acc + 1 + p.entries, 0)
}

export function playerCost(game: Pick<BalanceGame, 'settings'>, entries: number) {
  return game.settings.firstEntryCost + entries * game.settings.reEntryCost
}

export function gameBank(game: Pick<BalanceGame, 'players' | 'settings'>) {
  return game.players.reduce((acc, p) => acc + playerCost(game, p.entries), 0)
}

// Призовой фонд финала: собран за сезон (с процентами по вкладу и т. п.) и вносится в финал вручную
export function prizeFund(game: Pick<BalanceGame, 'settings'>) {
  return game.settings.isFinal ? game.settings.prizeFund ?? 0 : 0
}

// Процент в фонд берётся только с обычных игр: финал сам разыгрывает фонд
export function fundPercent(game: Pick<BalanceGame, 'settings'>) {
  return game.settings.isFinal ? 0 : game.settings.fundPercent ?? DEFAULT_FUND_PERCENT
}

// Всё, что делят призёры: взносы за входы плюс фонд финала
export function prizePool(game: Pick<BalanceGame, 'players' | 'settings'>) {
  return gameBank(game) + prizeFund(game)
}

// Выплата по стекам: банк (с фондом финала) делится между призёрами пропорционально их стекам
export function calcPayouts(game: BalanceGame): Record<string, number> {
  const payouts: Record<string, number> = {}
  const stacks = totalStacks(game)
  const pool = prizePool(game)
  if (stacks > 0) {
    for (const r of game.results ?? []) {
      const playerId = r.playerId.toString()
      payouts[playerId] = (payouts[playerId] ?? 0) + pool * r.score / stacks
    }
  }
  return payouts
}

/*
 * Взнос в призовой фонд с обычной игры: процент от выплаты по стекам, без вычета того,
 * что игрок заплатил за входы. 19 стеков по 100 ₽ при 10% — 190 ₽, сколько бы он ни докупался.
 */
export function calcFundContributions(game: BalanceGame): Record<string, number> {
  const percent = fundPercent(game)
  if (percent <= 0) {
    return {}
  }
  return Object.fromEntries(Object.entries(calcPayouts(game))
    .filter(([, payout]) => payout > 0)
    .map(([playerId, payout]) => [playerId, payout * percent / 100]))
}

// Выплата минус стоимость входов — до взноса в фонд; по этим суммам игроки рассчитываются друг с другом
export function calcGrossBalances(game: BalanceGame): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const p of game.players) {
    const playerId = p.playerId.toString()
    balances[playerId] = (balances[playerId] ?? 0) - playerCost(game, p.entries)
  }
  for (const [playerId, payout] of Object.entries(calcPayouts(game))) {
    balances[playerId] = (balances[playerId] ?? 0) + payout
  }
  return balances
}

/*
 * Итог игрока за игру: выплата по стекам минус взнос в фонд минус стоимость входов.
 * Сумма итогов: в обычной игре — минус собранное в фонд, в финале — плюс разыгранный фонд.
 */
export function calcGameBalances(game: BalanceGame): Record<string, number> {
  const balances = calcGrossBalances(game)
  for (const [playerId, contribution] of Object.entries(calcFundContributions(game))) {
    balances[playerId] -= contribution
  }
  return balances
}

// Сколько собрано в призовой фонд за сезон: взносы с завершённых обычных игр
export function seasonFundCollected(games: (BalanceGame & { isFinished: boolean })[]) {
  return games
    .filter(g => g.isFinished && !g.settings.isFinal)
    .reduce((acc, g) => acc + Object.values(calcFundContributions(g)).reduce((a, b) => a + b, 0), 0)
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
