import type { Transfer } from './settlement'
import { describe, expect, it } from 'vitest'
import { gameSettlement, PRIZE_FUND, roundBalances, settle } from './settlement'

function check(balances: Record<string, number>, transfers: Transfer[]) {
  const rounded = roundBalances(balances)
  const net: Record<string, number> = {}
  for (const t of transfers) {
    expect(t.amount).toBeGreaterThan(0)
    expect(Number.isInteger(t.amount)).toBe(true)
    expect(rounded[t.from]).toBeLessThan(0)
    expect(rounded[t.to]).toBeGreaterThan(0)
    net[t.from] = (net[t.from] ?? 0) - t.amount
    net[t.to] = (net[t.to] ?? 0) + t.amount
  }
  for (const [id, value] of Object.entries(rounded)) {
    expect(net[id] ?? 0).toBe(value)
  }
}

const paymentsBy = (transfers: Transfer[], id: string) => transfers.filter(t => t.from === id).length

describe('roundBalances', () => {
  it('целые рубли с нулевой суммой', () => {
    // банк 700 на 3 стека: 233.33 у каждого
    const rounded = roundBalances({ a: 133.333, b: 133.333, c: -266.666 })
    expect(Object.values(rounded).reduce((s, v) => s + v, 0)).toBe(0)
    expect(Object.values(rounded).every(Number.isInteger)).toBe(true)
  })

  it('не трогает целые', () => {
    expect(roundBalances({ a: 200, b: -200 })).toEqual({ a: 200, b: -200 })
  })

  it('убирает хвосты деления', () => {
    expect(roundBalances({ a: 199.99999999, b: -199.99999999 })).toEqual({ a: 200, b: -200 })
  })

  it('сохраняет ненулевую сумму (финал с фондом)', () => {
    // фонд 1000 на 3 равных призёра без взносов
    const rounded = roundBalances({ a: 333.333, b: 333.333, c: 333.334 })
    expect(Object.values(rounded).reduce((s, v) => s + v, 0)).toBe(1000)
  })
})

describe('gameSettlement', () => {
  const final = (results: [string, number][], prizeFund: number) => ({
    players: [{ playerId: 'a', entries: 0 }, { playerId: 'b', entries: 2 }, { playerId: 'c', entries: 0 }],
    results: results.map(([playerId, score]) => ({ playerId, score })),
    settings: { isFinal: true, firstEntryCost: 200, reEntryCost: 100, maxReEntries: 2, prizeFund },
  })

  it('фонд переводится победителю отдельным переводом без отправителя-игрока', () => {
    // банк 200 + 400 + 200 = 800, фонд 3000; один победитель забирает 3800
    const { balances, transfers } = gameSettlement(final([['a', 5]], 3000))
    expect(balances).toEqual({ a: 3600, b: -400, c: -200 })
    expect(transfers).toContainEqual({ from: PRIZE_FUND, to: 'a', amount: 3000 })
    expect(transfers).toContainEqual({ from: 'b', to: 'a', amount: 400 })
    expect(transfers).toContainEqual({ from: 'c', to: 'a', amount: 200 })
    expect(transfers).toHaveLength(3)
  })

  it('фонд делится между призёрами пропорционально стекам', () => {
    // 3800 на 5 стеков = 760 за стек: a 3 стека → 2280, b 2 стека → 1520
    const { balances, transfers } = gameSettlement(final([['a', 3], ['b', 2]], 3000))
    expect(balances).toEqual({ a: 2080, b: 1120, c: -200 })
    const received = (id: string) => transfers.filter(t => t.to === id).reduce((s, t) => s + t.amount, 0)
    expect(received('a')).toBe(2080)
    expect(received('b')).toBe(1120)
    expect(transfers.filter(t => t.from === PRIZE_FUND).reduce((s, t) => s + t.amount, 0)).toBe(3000)
  })

  it('без фонда — обычные переводы', () => {
    const { transfers } = gameSettlement(final([['a', 5]], 0))
    expect(transfers.some(t => t.from === PRIZE_FUND)).toBe(false)
  })

  it('обычная игра: игроки рассчитываются по выплате, призёр отдельно переводит процент в фонд', () => {
    // банк 700 на 7 стеков: a забирает все (700), в фонд 10% — 70; итог 700 − 70 − 100
    const regular = {
      players: [{ playerId: 'a', entries: 0 }, { playerId: 'b', entries: 2 }, { playerId: 'c', entries: 2 }],
      results: [{ playerId: 'a', score: 7 }],
      settings: { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5, fundPercent: 10 },
    }
    const { balances, contributions, transfers } = gameSettlement(regular)
    expect(balances).toEqual({ a: 530, b: -300, c: -300 })
    expect(contributions).toEqual({ a: 70 })
    expect(transfers).toEqual([
      { from: 'b', to: 'a', amount: 300 },
      { from: 'c', to: 'a', amount: 300 },
      { from: 'a', to: PRIZE_FUND, amount: 70 },
    ])
  })
})

describe('settle', () => {
  it('должник платит одному победителю, если его выигрыша хватает', () => {
    const balances = { loser: -600, big: 700, small: 300, other: -400 }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers).toContainEqual({ from: 'loser', to: 'big', amount: 600 })
    expect(paymentsBy(transfers, 'loser')).toBe(1)
  })

  it('не делит долг по 300, когда один выигрыш его покрывает', () => {
    const balances = { loser: -600, a: 700, b: 500, c: -600 }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers).toHaveLength(3)
    expect(Math.min(paymentsBy(transfers, 'loser'), paymentsBy(transfers, 'c'))).toBe(1)
  })

  it('дробит долг, только когда ни один выигрыш его не покрывает', () => {
    const balances = { loser: -600, a: 400, b: 200 }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers).toEqual([
      { from: 'loser', to: 'a', amount: 400 },
      { from: 'loser', to: 'b', amount: 200 },
    ])
  })

  it('находит пары с равными суммами', () => {
    const balances = { a: 500, b: 300, x: -300, y: -250, z: -250 }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers).toHaveLength(3)
    expect(transfers).toContainEqual({ from: 'x', to: 'b', amount: 300 })
  })

  it('минимум переводов: n − число групп с нулевой суммой', () => {
    // {a, x} и {b, c, y, z} — две группы: 6 участников → 4 перевода
    const balances = { a: 350, x: -350, b: 400, c: 100, y: -320, z: -180 }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers).toHaveLength(4)
  })

  it('без проигравших переводов нет', () => {
    expect(settle({ a: 0, b: 0 })).toEqual([])
  })

  it('дробные балансы', () => {
    const balances = { a: 342.857, b: 171.428, c: -214.285, d: -300 }
    check(balances, settle(balances))
  })

  it('большая игра — жадный расчёт без перебора', () => {
    const balances: Record<string, number> = {}
    // выигрыши 300…1500 (всего 4500) и 15 проигрышей по 300
    for (let i = 0; i < 20; i++) {
      balances[`p${i}`] = i < 5 ? 300 * (i + 1) : -300
    }
    const transfers = settle(balances)
    check(balances, transfers)
    expect(transfers.length).toBeLessThanOrEqual(19)
  })

  it('одинаковый результат при любом порядке', () => {
    const a = settle({ x: -600, a: 700, b: 300, y: -400 })
    const b = settle({ b: 300, y: -400, a: 700, x: -600 })
    expect(a).toEqual(b)
  })
})
