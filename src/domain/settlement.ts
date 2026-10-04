// Кто кому переводит деньги после игры. Чистая логика: работает и на сервере, и в интерфейсе.

import type { BalanceGame } from './balances'
import { calcGameBalances, prizeFund } from './balances'

export interface Transfer {
  from: string
  to: string
  amount: number
}

// Призовой фонд финала в расчётах — отдельный «участник», который только отдаёт деньги
export const PRIZE_FUND = 'prize-fund'

// Балансы в целых рублях так, чтобы сумма осталась прежней — нулевой или равной фонду (метод наибольших остатков)
export function roundBalances(balances: Record<string, number>): Record<string, number> {
  // Сначала копейки: убирает хвосты вроде 199.99999999 от деления банка
  const entries = Object.entries(balances).map(([id, value]) => ({ id, kopecks: Math.round(value * 100) }))
  const rounded = entries.map(e => ({ id: e.id, rubles: Math.floor(e.kopecks / 100), rest: e.kopecks - Math.floor(e.kopecks / 100) * 100 }))
  const total = Math.round(entries.reduce((acc, e) => acc + e.kopecks, 0) / 100)
  let missing = total - rounded.reduce((acc, e) => acc + e.rubles, 0)
  for (const e of [...rounded].sort((a, b) => b.rest - a.rest || a.id.localeCompare(b.id))) {
    if (missing <= 0) {
      break
    }
    e.rubles++
    missing--
  }
  return Object.fromEntries(rounded.map(e => [e.id, e.rubles]))
}

// Для точного поиска перебираем подмножества: 2^16 вариантов — мгновенно
const MAX_EXACT = 16

interface Party { id: string, amount: number }

/*
 * Переводов меньше всего, когда участники разбиты на как можно больше групп с нулевой суммой:
 * группа из k человек рассчитывается за k − 1 перевод. Ищем такое разбиение динамикой по подмножествам.
 */
function zeroSumGroups(parties: Party[]): Party[][] {
  const n = parties.length
  const size = 1 << n
  const sum = new Float64Array(size)
  const best = new Int8Array(size)
  const removed = new Int8Array(size)
  for (let mask = 1; mask < size; mask++) {
    const low = 31 - Math.clz32(mask & -mask)
    sum[mask] = sum[mask & (mask - 1)] + parties[low].amount
    let value = -1
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i) && best[mask ^ (1 << i)] > value) {
        value = best[mask ^ (1 << i)]
        removed[mask] = i
      }
    }
    best[mask] = value + (sum[mask] === 0 ? 1 : 0)
  }

  // Идём от полного набора к пустому: между соседними масками с нулевой суммой — одна группа
  const groups: Party[][] = []
  let current: Party[] = []
  for (let mask = size - 1; mask > 0;) {
    const i = removed[mask]
    current.push(parties[i])
    mask ^= 1 << i
    if (sum[mask] === 0) {
      groups.push(current)
      current = []
    }
  }
  return groups
}

/*
 * Внутри группы: должники от большего долга к меньшему, каждый — по возможности одним переводом
 * тому, чьего выигрыша на это хватает (из подходящих — с наименьшим остатком, чтобы крупные
 * выигрыши достались крупным долгам). Если такого нет, долг дробится, начиная с самого крупного выигрыша.
 */
function settleGroup(parties: Party[]): Transfer[] {
  const byAmount = (a: Party, b: Party) => Math.abs(b.amount) - Math.abs(a.amount) || a.id.localeCompare(b.id)
  const debtors = parties.filter(p => p.amount < 0).map(p => ({ ...p, amount: -p.amount })).sort(byAmount)
  const creditors = parties.filter(p => p.amount > 0).map(p => ({ ...p })).sort(byAmount)
  const transfers: Transfer[] = []

  for (const debtor of debtors) {
    while (debtor.amount > 0) {
      const open = creditors.filter(c => c.amount > 0)
      if (open.length === 0) {
        break
      }
      const fit = open.filter(c => c.amount >= debtor.amount).sort((a, b) => a.amount - b.amount)[0]
      const creditor = fit ?? open.sort((a, b) => b.amount - a.amount)[0]
      const amount = Math.min(debtor.amount, creditor.amount)
      transfers.push({ from: debtor.id, to: creditor.id, amount })
      debtor.amount -= amount
      creditor.amount -= amount
    }
  }
  return transfers
}

/*
 * Итоги игры для показа и переводов: балансы игроков в целых рублях и кто кому переводит.
 * Фонд финала выплачивает призёрам как ещё один «должник» (from === PRIZE_FUND).
 */
export function gameSettlement(game: BalanceGame) {
  const exact = calcGameBalances(game)
  const fund = prizeFund(game)
  const parties = fund > 0 ? { ...exact, [PRIZE_FUND]: -fund } : exact
  const { [PRIZE_FUND]: _, ...balances } = roundBalances(parties)
  return { balances, transfers: settle(parties) }
}

// Переводы, которые закрывают все долги по игре: от проигравших к выигравшим, в целых рублях.
// Сумма балансов должна быть нулевой — фонд финала передаётся отдельным участником
export function settle(balances: Record<string, number>): Transfer[] {
  const parties = Object.entries(roundBalances(balances))
    .filter(([, amount]) => amount !== 0)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => a.id.localeCompare(b.id))
  const groups = parties.length <= MAX_EXACT ? zeroSumGroups(parties) : [parties]
  return groups.flatMap(settleGroup).sort((a, b) => b.amount - a.amount || a.from.localeCompare(b.from))
}
