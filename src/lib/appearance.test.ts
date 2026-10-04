import { describe, expect, it } from 'vitest'
import { defaultAppearance, isAppearance, resolveAppearance } from './appearance'

const browser = { inTelegram: false, telegramDark: false, systemDark: false }
const telegram = { inTelegram: true, telegramDark: true, systemDark: false }

describe('resolveAppearance', () => {
  it('по умолчанию: в браузере Сукно, в Telegram — тема клиента', () => {
    expect(resolveAppearance(defaultAppearance(false), browser)).toEqual({ theme: 'felt', dark: false })
    expect(resolveAppearance(defaultAppearance(true), telegram)).toEqual({ theme: 'telegram', dark: true })
  })

  it('«Как в Telegram» вне Telegram превращается в Сукно', () => {
    expect(resolveAppearance({ theme: 'telegram', mode: 'dark' }, browser)).toEqual({ theme: 'felt', dark: true })
  })

  it('с темой Telegram режим всегда из клиента, даже если выбран другой', () => {
    expect(resolveAppearance({ theme: 'telegram', mode: 'light' }, telegram)).toEqual({ theme: 'telegram', dark: true })
  })

  it('системный режим: в браузере по системе, в Telegram по клиенту', () => {
    expect(resolveAppearance({ theme: 'chip', mode: 'system' }, { ...browser, systemDark: true }).dark).toBe(true)
    expect(resolveAppearance({ theme: 'chip', mode: 'system' }, telegram).dark).toBe(true)
  })

  it('явный режим важнее системного', () => {
    expect(resolveAppearance({ theme: 'caramel', mode: 'light' }, { ...browser, systemDark: true })).toEqual({ theme: 'caramel', dark: false })
  })
})

describe('isAppearance', () => {
  it('отклоняет мусор и удалённые темы', () => {
    expect(isAppearance({ theme: 'plum', mode: 'dark' })).toBe(false)
    expect(isAppearance(null)).toBe(false)
    expect(isAppearance({ theme: 'graphite', mode: 'dark' })).toBe(true)
  })
})
