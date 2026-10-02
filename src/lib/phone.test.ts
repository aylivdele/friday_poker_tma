import { describe, expect, it } from 'vitest'
import { maskPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (916) 123-45-67', '79161234567'],
    ['8 916 123 45 67', '79161234567'],
    ['9161234567', '79161234567'],
    ['79161234567', '79161234567'],
    ['+375 29 123-45-67', '375291234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it('отклоняет слишком короткие и длинные номера', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('1'.repeat(16))).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })
})

describe('maskPhone', () => {
  it('оставляет код страны и последние 4 цифры', () => {
    expect(maskPhone('79161234567')).toBe('+7 ••• •••-45-67')
    expect(maskPhone('375291234567')).toBe('+37 ••• •••-45-67')
  })
})
