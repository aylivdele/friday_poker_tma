import type { Transfer } from './settlement'
import { describe, expect, it } from 'vitest'
import { roundBalances, settle } from './settlement'

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
