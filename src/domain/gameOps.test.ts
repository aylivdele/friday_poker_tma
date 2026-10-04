import type { EditableGame, GameOpContext } from './gameOps'
import { describe, expect, it } from 'vitest'
import { applyOps, GameOpError } from './gameOps'

const game: EditableGame = {
  title: 'Игра',
  createdAt: 0,
  players: [{ playerId: 'a', entries: 1 }, { playerId: 'b', entries: 0 }],
  settings: { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 3 },
}

const ctx: GameOpContext = {
  capsFor: s => ({ a: s.maxReEntries + 1, b: s.maxReEntries + 1, c: s.isFinal ? 0 : s.maxReEntries + 1, d: s.maxReEntries + 1 }),
  canAdd: id => id !== 'stranger',
}

function expectError(fn: () => unknown, kind: 'conflict' | 'invalid') {
  try {
    fn()
  }
  catch (e) {
    expect(e).toBeInstanceOf(GameOpError)
    expect((e as GameOpError).kind).toBe(kind)
    return
  }
  throw new Error('ожидалась ошибка')
}

describe('applyOps', () => {
  it('докуп меняет входы игрока', () => {
    const next = applyOps(game, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx)
    expect(next.players[0].entries).toBe(2)
    expect(game.players[0].entries).toBe(1)
  })

  it('повтор того же докупа с другого телефона не засчитывается дважды', () => {
    const once = applyOps(game, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx)
    const twice = applyOps(once, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx)
    expect(twice.players[0].entries).toBe(2)
  })

  it('устаревшее значение — конфликт', () => {
    const changed = applyOps(game, [{ type: 'setEntries', playerId: 'a', from: 1, to: 3 }], ctx)
    expectError(() => applyOps(changed, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx), 'conflict')
  })

  it('правки разных игроков с двух телефонов сливаются', () => {
    const phone1 = applyOps(game, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx)
    const merged = applyOps(phone1, [{ type: 'setEntries', playerId: 'b', from: 0, to: 1 }], ctx)
    expect(merged.players.map(p => p.entries)).toEqual([2, 1])
  })

  it('нельзя превысить лимит, но уменьшать можно всегда', () => {
    expectError(() => applyOps(game, [{ type: 'setEntries', playerId: 'a', from: 1, to: 4 }], ctx), 'invalid')
    const over = { ...game, players: [{ playerId: 'a', entries: 9 }] }
    expect(applyOps(over, [{ type: 'setEntries', playerId: 'a', from: 9, to: 8 }], ctx).players[0].entries).toBe(8)
  })

  it('добавление: только участники, повтор безопасен, лимит финала учитывается', () => {
    expect(applyOps(game, [{ type: 'addPlayer', playerId: 'd' }], ctx).players).toHaveLength(3)
    expect(applyOps(game, [{ type: 'addPlayer', playerId: 'a' }], ctx).players).toHaveLength(2)
    expectError(() => applyOps(game, [{ type: 'addPlayer', playerId: 'stranger' }], ctx), 'invalid')
    const final = { ...game, settings: { ...game.settings, isFinal: true } }
    expectError(() => applyOps(final, [{ type: 'addPlayer', playerId: 'c' }], ctx), 'invalid')
  })

  it('удаление идемпотентно; докуп удалённому — конфликт', () => {
    const removed = applyOps(game, [{ type: 'removePlayer', playerId: 'a' }, { type: 'removePlayer', playerId: 'a' }], ctx)
    expect(removed.players.map(p => p.playerId)).toEqual(['b'])
    expectError(() => applyOps(removed, [{ type: 'setEntries', playerId: 'a', from: 1, to: 2 }], ctx), 'conflict')
  })

  it('нельзя урезать лимит ниже уже сделанных входов, а цены менять можно', () => {
    expectError(() => applyOps(game, [{ type: 'setSettings', settings: { maxReEntries: 0 } }], ctx), 'invalid')
    expect(applyOps(game, [{ type: 'setSettings', settings: { reEntryCost: 200 } }], ctx).settings.reEntryCost).toBe(200)
  })

  it('пустое название не принимается', () => {
    expectError(() => applyOps(game, [{ type: 'setMeta', title: '  ' }], ctx), 'invalid')
    expect(applyOps(game, [{ type: 'setMeta', title: ' Пятница ', createdAt: 5 }], ctx)).toMatchObject({ title: 'Пятница', createdAt: 5 })
  })
})
