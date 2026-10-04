import type { WithId } from 'mongodb'
import type { Game, Player } from '@/types/db'
import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { computeAchievments, getAchievmentsInfo } from './achievments'

const me = new ObjectId()
const a = new ObjectId()
const b = new ObjectId()
const player: WithId<Player> = { _id: me, createdAt: 0, firstName: 'Я' }
const groupId = new ObjectId()

// 2 октября 2026 — пятница; обычные игры раз в неделю по пятницам
const friday = (week: number) => Date.UTC(2026, 9, 2 + 7 * week)
const msk = (y: number, m: number, d: number, h: number) => Date.UTC(y, m, d, h - 3)

interface GameSpec {
  players: [ObjectId, number][]
  results: [ObjectId, number][]
  week?: number
  createdAt?: number
  finishedAt?: number
  isFinal?: boolean
  seasonId?: ObjectId
  maxReEntries?: number
  // по умолчанию без взноса в фонд, чтобы суммы в проверках были круглыми
  fundPercent?: number
}

let counter = 0
function game(spec: GameSpec): WithId<Game> {
  counter++
  return {
    _id: new ObjectId(),
    groupId,
    title: `Игра ${counter}`,
    isFinished: true,
    createdAt: spec.createdAt ?? friday(spec.week ?? counter),
    finishedAt: spec.finishedAt,
    seasonId: spec.seasonId,
    settings: { isFinal: spec.isFinal ?? false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: spec.maxReEntries ?? 5, fundPercent: spec.fundPercent ?? 0 },
    players: spec.players.map(([playerId, entries]) => ({ playerId, entries })),
    results: spec.results.map(([playerId, score]) => ({ playerId, score })),
  }
}

// Победа: я без докупов забираю все стеки соперника с одним докупом (+200)
const win = (week?: number) => game({ week, players: [[me, 0], [a, 1]], results: [[me, 3]] })
// Поражение: без стеков
const loss = (week?: number) => game({ week, players: [[me, 0], [a, 0]], results: [[a, 2]] })

function compute(games: WithId<Game>[], seasonGames: WithId<Game>[] = []) {
  const seasons = new Map<string, WithId<Game>[]>()
  for (const g of seasonGames) {
    seasons.set(g.seasonId!.toString(), [...(seasons.get(g.seasonId!.toString()) ?? []), g])
  }
  const sorted = [...games].sort((x, y) => x.createdAt - y.createdAt)
  return computeAchievments(player, sorted, seasons)
}

// В длинных названиях стоят мягкие переносы — сравниваем без них
const idOf = (name: string) => getAchievmentsInfo().find(x => x.name.replace(/­/g, '') === name)!.id
const progressOf = (achievments: ReturnType<typeof compute>, name: string) => achievments.find(x => x.id === idOf(name))!.progress
function earned(achievments: ReturnType<typeof compute>, name: string) {
  const [value, max] = progressOf(achievments, name)
  return value >= max
}

describe('новые достижения', () => {
  it('ночь удалась — от 1 000 ₽ за игру', () => {
    // банк 1300 на 13 стеков: 12 стеков → 1200 − 100 = +1100
    const big = game({ players: [[me, 0], [a, 5], [b, 5]], results: [[me, 12], [a, 1]] })
    expect(earned(compute([big]), 'Ночь удалась')).toBe(true)
    expect(earned(compute([win()]), 'Ночь удалась')).toBe(false)
  })

  it('на пиво хватит — плюс не больше 100 ₽', () => {
    const small = game({ players: [[me, 0], [a, 0]], results: [[me, 2]] })
    expect(earned(compute([small]), 'На пиво хватит')).toBe(true)
    expect(earned(compute([win()]), 'На пиво хватит')).toBe(false)
  })

  it('спонсор вечера — больше всех проиграл и единственный с таким числом докупов', () => {
    const sponsor = game({ players: [[me, 3], [a, 1], [b, 1]], results: [[a, 5], [b, 3]] })
    expect(earned(compute([sponsor]), 'Спонсор вечера')).toBe(true)
    // докупились до лимита двое — не засчитываем
    const shared = game({ players: [[me, 5], [a, 5], [b, 0]], results: [[a, 6], [b, 7]] })
    expect(earned(compute([shared]), 'Спонсор вечера')).toBe(false)
  })

  it('стабильный доход — 10 игр в плюсе не подряд', () => {
    const games = Array.from({ length: 10 }, (_, i) => [win(2 * i), loss(2 * i + 1)]).flat()
    expect(earned(compute(games), 'Стабильный доход')).toBe(true)
    expect(progressOf(compute(games.slice(0, 18)), 'Стабильный доход')).toEqual([9, 10])
  })

  it('инвестор и Меценат — итог за всё время в рублях', () => {
    const wins = Array.from({ length: 25 }, (_, i) => win(i))
    expect(earned(compute(wins), 'Инвестор')).toBe(true)
    expect(progressOf(compute(wins.slice(0, 10)), 'Инвестор')).toEqual([2000, 5000])
    const losses = Array.from({ length: 50 }, (_, i) => loss(i))
    expect(earned(compute(losses), 'Меценат')).toBe(true)
    expect(progressOf(compute(losses), 'Инвестор')).toEqual([0, 5000])
  })

  it('полученный Меценат остаётся, даже если потом итог стал +5 000', () => {
    // −100 × 50 = −5 000, затем +200 × 75 = +15 000: итог +10 000
    const games = [...Array.from({ length: 50 }, (_, i) => loss(i)), ...Array.from({ length: 75 }, (_, i) => win(50 + i))]
    const result = compute(games)
    expect(earned(result, 'Меценат')).toBe(true)
    expect(earned(result, 'Инвестор')).toBe(true)
    // пока порог не достигнут, прогресс идёт за текущим итогом: −3 000, потом отыгрался до −1 000
    const partial = [...Array.from({ length: 30 }, (_, i) => loss(i)), ...Array.from({ length: 10 }, (_, i) => win(30 + i))]
    expect(progressOf(compute(partial), 'Меценат')).toEqual([1000, 5000])
  })

  it('феникс и Банкомат — все возможные докупы', () => {
    const phoenix = game({ players: [[me, 5], [a, 5]], results: [[me, 12]] })
    expect(earned(compute([phoenix]), 'Феникс')).toBe(true)
    const atm = game({ players: [[me, 5], [a, 0]], results: [[a, 7]] })
    expect(earned(compute([atm]), 'Банкомат')).toBe(true)
    const notAll = game({ players: [[me, 4], [a, 0]], results: [[a, 6]] })
    expect(earned(compute([notAll]), 'Банкомат')).toBe(false)
  })

  it('кредитная история и следующие пороги — докупы за всё время', () => {
    const games = Array.from({ length: 5 }, (_, i) => game({ week: i, players: [[me, 5], [a, 0]], results: [[a, 7]] }))
    const result = compute(games)
    expect(earned(result, 'Кредитная история')).toBe(true)
    expect(progressOf(result, 'Ипотека')).toEqual([25, 50])
    expect(progressOf(result, 'Системообразующий банк')).toEqual([25, 200])
  })

  it('хладнокровный — финал без докупов', () => {
    const final = game({ isFinal: true, players: [[me, 0], [a, 1]], results: [[me, 3]] })
    expect(earned(compute([final]), 'Хладнокровный')).toBe(true)
    expect(earned(compute([final]), 'Финалист')).toBe(true)
  })

  it('вечно второй — трижды второй по итогу', () => {
    const second = (week: number) => game({ week, players: [[me, 0], [a, 0], [b, 0]], results: [[a, 2], [me, 1]] })
    expect(earned(compute([second(1), second(2)]), 'Вечно второй')).toBe(false)
    expect(earned(compute([second(1), second(2), second(3)]), 'Вечно второй')).toBe(true)
  })

  it('камбэк — плюс после трёх проигрышей подряд', () => {
    expect(earned(compute([loss(1), loss(2), loss(3), win(4)]), 'Камбэк')).toBe(true)
    expect(earned(compute([loss(1), win(2), loss(3), win(4)]), 'Камбэк')).toBe(false)
  })

  it('блудный сын — вернулся после трёх пропущенных игр сезона', () => {
    const seasonId = new ObjectId()
    const mine1 = game({ week: 1, seasonId, players: [[me, 0], [a, 0]], results: [[a, 2]] })
    const skipped = [2, 3, 4].map(week => game({ week, seasonId, players: [[a, 0], [b, 0]], results: [[a, 2]] }))
    const mine2 = game({ week: 5, seasonId, players: [[me, 0], [a, 0]], results: [[a, 2]] })
    expect(earned(compute([mine1, mine2], [mine1, ...skipped, mine2]), 'Блудный сын')).toBe(true)
    expect(earned(compute([mine1, mine2], [mine1, skipped[0], skipped[1], mine2]), 'Блудный сын')).toBe(false)
  })

  it('новичкам везёт — плюс в самой первой игре', () => {
    expect(earned(compute([win(1), loss(2)]), 'Новичкам везёт')).toBe(true)
    expect(earned(compute([loss(1), win(2)]), 'Новичкам везёт')).toBe(false)
  })

  it('ни нашим, ни вашим — ровно ноль', () => {
    const even = game({ players: [[me, 0], [a, 1]], results: [[me, 1], [a, 2]] })
    expect(earned(compute([even]), 'Ни нашим, ни вашим')).toBe(true)
  })

  it('пятница — это состояние души: пятница или до обеда субботы не считаются', () => {
    const thursday = Date.UTC(2026, 9, 1)
    expect(earned(compute([game({ createdAt: friday(0), players: [[me, 0]], results: [[me, 1]] })]), 'Пятница — это состояние души')).toBe(false)
    expect(earned(compute([game({ createdAt: thursday, finishedAt: msk(2026, 9, 1, 23), players: [[me, 0]], results: [[me, 1]] })]), 'Пятница — это состояние души')).toBe(true)
    // назначили на субботу, но закончили в час ночи — всё ещё пятница
    expect(earned(compute([game({ createdAt: Date.UTC(2026, 9, 3), finishedAt: msk(2026, 9, 3, 1), players: [[me, 0]], results: [[me, 1]] })]), 'Пятница — это состояние души')).toBe(false)
    expect(earned(compute([game({ createdAt: Date.UTC(2026, 9, 3), finishedAt: msk(2026, 9, 3, 15), players: [[me, 0]], results: [[me, 1]] })]), 'Пятница — это состояние души')).toBe(true)
  })

  it('ночная смена — доиграли после 3:00 по Москве', () => {
    expect(earned(compute([game({ finishedAt: msk(2026, 9, 3, 4), players: [[me, 0]], results: [[me, 1]] })]), 'Ночная смена')).toBe(true)
    expect(earned(compute([game({ finishedAt: msk(2026, 9, 2, 23), players: [[me, 0]], results: [[me, 1]] })]), 'Ночная смена')).toBe(false)
  })

  it('король сезона и Сезон в плюс — по таблице, когда сыгран финал', () => {
    const seasonId = new ObjectId()
    const regular = game({ week: 1, seasonId, players: [[me, 0], [a, 1]], results: [[me, 3]] })
    const final = game({ week: 2, seasonId, isFinal: true, players: [[a, 0], [b, 0]], results: [[a, 2]] })
    // в финал я не попал, но по таблице сезона лучший: +200 против −100 у остальных
    const result = compute([regular], [regular, final])
    expect(earned(result, 'Король сезона')).toBe(true)
    expect(earned(result, 'Сезон в плюс')).toBe(true)
    // без финала сезон не закончен
    expect(earned(compute([regular], [regular]), 'Король сезона')).toBe(false)
  })

  it('старые достижения считаются как раньше', () => {
    const result = compute([loss(1), loss(2), loss(3)])
    expect(earned(result, 'Посвящение')).toBe(true)
    expect(earned(result, 'Закономерность?')).toBe(true)
    expect(earned(result, 'Потеря девственности')).toBe(false)
  })
})
