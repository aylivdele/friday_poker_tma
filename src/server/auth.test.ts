import type { NextRequest } from 'next/server'
import process from 'node:process'
import { sign } from '@tma.js/init-data-node'
import { beforeAll, describe, expect, it } from 'vitest'
import { getTelegramUser } from './auth'
import { HttpError } from './http'

const TOKEN = '123456:test-token'

function request(initData?: string) {
  return { headers: new Headers(initData ? { 'x-init-data': initData } : {}) } as NextRequest
}

function signedInitData(authDate: Date, token = TOKEN) {
  return sign({ user: { id: 42, first_name: 'Тест', username: 'test' } } as Parameters<typeof sign>[0], token, authDate)
}

describe('getTelegramUser', () => {
  beforeAll(() => {
    process.env.TELEGRAM_BOT_TOKEN = TOKEN
  })

  it('без заголовка возвращает null', () => {
    expect(getTelegramUser(request())).toBeNull()
  })

  it('принимает данные, подписанные токеном бота', () => {
    expect(getTelegramUser(request(signedInitData(new Date())))?.id).toBe(42)
  })

  it('принимает данные трёхдневной давности', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(getTelegramUser(request(signedInitData(threeDaysAgo)))?.id).toBe(42)
  })

  it('отклоняет данные старше недели', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    expect(() => getTelegramUser(request(signedInitData(eightDaysAgo)))).toThrow(HttpError)
  })

  it('отклоняет данные, подписанные чужим токеном', () => {
    expect(() => getTelegramUser(request(signedInitData(new Date(), '999:other')))).toThrow(HttpError)
  })
})
