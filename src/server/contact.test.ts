import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyContact } from './contact'
import { HttpError } from './http'

const TOKEN = '123456:test-token'

// Подпись по алгоритму Telegram для initData: HMAC-SHA256 от отсортированных пар key=value
function signContact(contact: object, authDate: Date, token = TOKEN) {
  const params = new URLSearchParams({ contact: JSON.stringify(contact), auth_date: String(Math.floor(authDate.getTime() / 1000)) })
  const checkString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(token).digest()
  params.set('hash', createHmac('sha256', secret).update(checkString).digest('hex'))
  return params.toString()
}

const contact = { user_id: 42, phone_number: '79161234567', first_name: 'Тест' }

describe('verifyContact', () => {
  it('принимает контакт, подписанный токеном бота', () => {
    expect(verifyContact(signContact(contact, new Date()), TOKEN)).toEqual({ userId: 42, phone: '79161234567' })
  })

  it('принимает старый контакт: Telegram отдаёт ранее отправленный', () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    expect(verifyContact(signContact(contact, yearAgo), TOKEN).phone).toBe('79161234567')
  })

  it('нормализует номер', () => {
    expect(verifyContact(signContact({ ...contact, phone_number: '+7 916 123-45-67' }, new Date()), TOKEN).phone).toBe('79161234567')
  })

  it('отклоняет подделку', () => {
    const forged = signContact(contact, new Date()).replace('79161234567', '79990000000')
    expect(() => verifyContact(forged, TOKEN)).toThrow(HttpError)
    expect(() => verifyContact(signContact(contact, new Date(), '999:other'), TOKEN)).toThrow(HttpError)
  })
})
