import type { BinaryLike, ScryptOptions } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const PARAMS = { N: 16384, r: 8, p: 1 }

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

function derive(password: BinaryLike, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (err, key) => err ? reject(err) : resolve(key))
  })
}

// Формат: scrypt$N$r$p$соль$хеш — параметры хранятся рядом с хешем, чтобы их можно было менять
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false
  }
  const expected = Buffer.from(hash, 'base64')
  const key = await derive(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p) })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

let dummyHash: Promise<string> | undefined

// Для неизвестного номера всё равно считаем scrypt, чтобы по времени ответа нельзя было узнать, есть ли номер
export function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'))
  return dummyHash
}
