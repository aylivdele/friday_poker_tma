import { describe, expect, it } from 'vitest'
import { formatGameDate, formatMoney, initials, playerName, plural, shortPlayerName } from './format'

// Intl ставит неразрывные пробелы; \s их тоже ловит
const nbsp = (s: string) => s.replace(/\s/g, ' ')

describe('formatMoney', () => {
  it('рубли с разделителем тысяч и знаком', () => {
    expect(nbsp(formatMoney(1200))).toBe('1 200 ₽')
    expect(nbsp(formatMoney(1200, { sign: true }))).toBe('+1 200 ₽')
    expect(nbsp(formatMoney(-300))).toBe('−300 ₽')
    expect(nbsp(formatMoney(0, { sign: true }))).toBe('0 ₽')
    expect(nbsp(formatMoney(66.6, { sign: true }))).toBe('+67 ₽')
  })
})

describe('даты и имена', () => {
  it('дата игры — по UTC, без сдвига на часовой пояс', () => {
    expect(formatGameDate(Date.UTC(2026, 9, 2))).toMatch(/2 октября/)
  })

  it('имена и инициалы', () => {
    expect(playerName({ firstName: 'Боб', lastName: 'Бобов' })).toBe('Боб Бобов')
    expect(playerName({ firstName: 'Женя', lastName: '' })).toBe('Женя')
    expect(shortPlayerName({ firstName: 'Боб', lastName: 'Бобов' })).toBe('Боб Б.')
    expect(initials({ firstName: 'боб', lastName: 'бобов' })).toBe('ББ')
    expect(initials({})).toBe('?')
  })

  it('склонение', () => {
    expect(plural(1, ['игра', 'игры', 'игр'])).toBe('1 игра')
    expect(plural(3, ['игра', 'игры', 'игр'])).toBe('3 игры')
    expect(plural(11, ['игра', 'игры', 'игр'])).toBe('11 игр')
    expect(plural(22, ['игра', 'игры', 'игр'])).toBe('22 игры')
  })
})
