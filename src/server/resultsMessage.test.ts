import type { ResultsMessageInput } from './resultsMessage'
import { describe, expect, it } from 'vitest'
import { buildResultsMessage } from './resultsMessage'

const base: Omit<ResultsMessageInput, 'recipientId'> = {
  title: 'Игра 3',
  date: Date.UTC(2026, 9, 2),
  groupTitle: 'Пятница',
  seasonTitle: 'Осень',
  corrected: false,
  players: new Map([
    ['alice', { firstName: 'Алиса', username: 'alice' }],
    ['bob', { firstName: 'Боб', lastName: 'Бобов', username: 'bob' }],
    ['dima', { firstName: 'Дима <3' }],
    ['zhenya', { firstName: 'Женя' }],
  ]),
  balances: { alice: 700, bob: -600, dima: 0, zhenya: -100 },
  transfers: [{ from: 'bob', to: 'alice', amount: 600 }, { from: 'zhenya', to: 'alice', amount: 100 }],
  winners: ['alice'],
}

describe('buildResultsMessage', () => {
  it('проигравшему — кому переводить', () => {
    const text = buildResultsMessage({ ...base, recipientId: 'bob' })
    expect(text).toContain('🃏 Игра завершена: <b>Игра 3</b>')
    expect(text).toContain('Пятница · Осень · ')
    expect(text).toContain('Ваш итог: <b>−600 ₽</b>')
    expect(text).toContain('Переведите:\n• Алиса (@alice) — <b>600 ₽</b>')
    expect(text).toContain('🏆 Алиса — +700 ₽')
    expect(text).toContain('Боб Бобов (вы) — −600 ₽')
    expect(text).toContain('<b>Остальные переводы</b>\nЖеня → Алиса: 100 ₽')
  })

  it('победителю — кто ему переведёт', () => {
    const text = buildResultsMessage({ ...base, recipientId: 'alice' })
    expect(text).toContain('Ваш итог: <b>+700 ₽</b>')
    expect(text).toContain('Вам переведут:\n• Боб Бобов (@bob) — <b>600 ₽</b>\n• Женя — <b>100 ₽</b>')
    expect(text).not.toContain('Остальные переводы')
  })

  it('в нуле — без переводов, имена экранируются', () => {
    const text = buildResultsMessage({ ...base, recipientId: 'dima', corrected: true })
    expect(text).toContain('✏️ Итоги исправлены')
    expect(text).toContain('Переводов нет — вы в нуле')
    expect(text).toContain('Дима &lt;3 (вы) — 0 ₽')
  })
})
