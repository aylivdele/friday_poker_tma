import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('проверяет правильный пароль и отклоняет неправильный', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(hash.startsWith('scrypt$16384$8$1$')).toBe(true)
    expect(await verifyPassword('correct horse battery', hash)).toBe(true)
    expect(await verifyPassword('correct horse batterY', hash)).toBe(false)
  })

  it('для одного пароля получаются разные хеши (соль)', async () => {
    expect(await hashPassword('same-password')).not.toBe(await hashPassword('same-password'))
  })

  it('не падает на испорченном хеше', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false)
    expect(await verifyPassword('x', 'scrypt$16384$8$1$$')).toBe(false)
  })
})
