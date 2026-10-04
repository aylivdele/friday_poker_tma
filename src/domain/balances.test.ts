import type { BalanceGame } from './balances'
import { describe, expect, it } from 'vitest'
import { calcEntryCaps, calcFundContributions, calcGameBalances, calcSeasonEntryShares, fundPercent, getGameWinners, seasonFundCollected, totalStacks } from './balances'

function game(players: [string, number][], results: [string, number][], settings: Partial<BalanceGame['settings']> = {}): BalanceGame {
  return {
    players: players.map(([playerId, entries]) => ({ playerId, entries })),
    results: results.map(([playerId, score]) => ({ playerId, score })),
    settings: { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5, fundPercent: 0, ...settings },
  }
}

function sum(balances: Record<string, number>) {
  return Object.values(balances).reduce((a, b) => a + b, 0)
}

// Старая формула — только для сравнения: при равных ценах входов она должна совпадать с новой
function oldRegularBalances(g: BalanceGame) {
  const balances: Record<string, number> = {}
  for (const p of g.players) {
    balances[p.playerId.toString()] = -(g.settings.firstEntryCost + p.entries * g.settings.reEntryCost)
  }
  for (const r of g.results ?? []) {
    balances[r.playerId.toString()] += r.score * g.settings.reEntryCost
  }
  return balances
}

describe('calcGameBalances', () => {
  it('совпадает со старой формулой, когда цены входов равны', () => {
    const g = game([['a', 0], ['b', 2], ['c', 1]], [['a', 5], ['b', 1]])
    expect(calcGameBalances(g)).toEqual(oldRegularBalances(g))
  })

  it('сумма балансов всегда 0, даже при разных ценах входов', () => {
    const g = game([['a', 0], ['b', 3], ['c', 1], ['d', 0]], [['a', 4], ['c', 3], ['d', 1]], { firstEntryCost: 150, reEntryCost: 100 })
    expect(sum(calcGameBalances(g))).toBeCloseTo(0, 9)
  })

  it('призовой фонд финала делится между призёрами по стекам вместе с банком', () => {
    // банк 300 + фонд 3000 = 3300 на 3 стека: 1100 за стек
    const g = game([['a', 0], ['b', 0], ['c', 0]], [['a', 2], ['b', 1]], { isFinal: true, prizeFund: 3000 })
    expect(calcGameBalances(g)).toEqual({ a: 2100, b: 1000, c: -100 })
    expect(sum(calcGameBalances(g))).toBe(3000)
    expect(getGameWinners(g)).toEqual(['a'])
  })

  it('в фонд уходит процент выплаты по стекам, без учёта входов', () => {
    // 19 стеков по 100 ₽, у победителя 3 докупа: в фонд 190 ₽, итог 1900 − 190 − 400
    const g = game([['a', 3], ['b', 5], ['c', 5], ['d', 2]], [['a', 19]], { fundPercent: 10 })
    expect(calcFundContributions(g)).toEqual({ a: 190 })
    expect(calcGameBalances(g).a).toBe(1310)
    expect(sum(calcGameBalances(g))).toBeCloseTo(-190, 9)
  })

  it('без поля — 10%, в финале процент не берётся', () => {
    const { fundPercent: _, ...noField } = game([], []).settings
    expect(fundPercent({ settings: noField })).toBe(10)
    expect(fundPercent({ settings: { ...noField, isFinal: true, fundPercent: 10 } })).toBe(0)
  })

  it('собрано за сезон — со всех завершённых обычных игр', () => {
    const regular = { ...game([['a', 0], ['b', 0]], [['a', 2]], { fundPercent: 10 }), isFinished: true }
    const live = { ...regular, isFinished: false }
    const final = { ...game([['a', 0], ['b', 0]], [['a', 2]], { isFinal: true, fundPercent: 10 }), isFinished: true }
    expect(seasonFundCollected([regular, regular, live, final])).toBe(40)
  })

  it('фонд в обычной игре не учитывается', () => {
    const g = game([['a', 0], ['b', 0]], [['a', 2]], { prizeFund: 3000 })
    expect(calcGameBalances(g)).toEqual({ a: 100, b: -100 })
  })

  it('делит банк финала пропорционально стекам', () => {
    // 3 игрока без докупов, банк 300, победитель забирает 2 стека из 3, второй — 1
    const g = game([['a', 0], ['b', 0], ['c', 0]], [['a', 2], ['b', 1]], { isFinal: true })
    expect(calcGameBalances(g)).toEqual({ a: 100, b: 0, c: -100 })
  })

  it('единственный призёр финала забирает весь банк', () => {
    const g = game([['a', 1], ['b', 0]], [['a', 3]], { isFinal: true, firstEntryCost: 200, reEntryCost: 100 })
    // банк = 300 + 200 = 500, расход a = 300
    expect(calcGameBalances(g)).toEqual({ a: 200, b: -200 })
  })

  it('игра без игроков не ломает расчёт', () => {
    expect(calcGameBalances(game([], []))).toEqual({})
    expect(totalStacks(game([], []))).toBe(0)
  })
})

describe('getGameWinners', () => {
  it('возвращает всех с максимальным балансом', () => {
    const g = game([['a', 0], ['b', 0], ['c', 0], ['d', 0]], [['a', 2], ['b', 2]])
    expect(getGameWinners(g).sort()).toEqual(['a', 'b'])
  })
})

describe('calcEntryCaps', () => {
  it('в обычной игре всем доступно maxReEntries + 1', () => {
    expect(calcEntryCaps({ settings: { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 3 } }, ['a', 'b'], []))
      .toEqual({ a: 4, b: 4 })
  })

  it('в финале без сыгранных обычных игр лимит не обнуляется', () => {
    expect(calcEntryCaps({ settings: { isFinal: true, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 3 } }, ['a'], []))
      .toEqual({ a: 4 })
  })

  it('в финале лимит зависит от доли входов за сезон', () => {
    const season = [
      game([['a', 4], ['b', 0]], [['b', 6]]), // b — призёр, ему засчитывается максимум
      game([['a', 0]], [['a', 1]]),
    ]
    // максимум за сезон 6 + 6 = 12; a: 5 + 6 = 11, b: 6
    expect(calcSeasonEntryShares(season)).toEqual({ a: 11 / 12, b: 6 / 12 })
    expect(calcEntryCaps({ settings: { isFinal: true, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5 } }, ['a', 'b', 'c'], season))
      .toEqual({ a: 5, b: 3, c: 0 })
  })
})
