import type { ObjectId, WithId } from 'mongodb'
import type { NextRequest } from 'next/server'
import type { Player } from '@/types/db'
import process from 'node:process'
import { parse, validate } from '@tma.js/init-data-node'
import { getDb } from '@/core/db'
import { TELEGRAM_EXPIRED } from '@/lib/errors'
import { unauthorized } from './http'
import { findSession } from './sessions'

// Внутри Telegram — по подписанным initData в заголовке, в браузере — по cookie сессии
export type Auth
  = | { player: WithId<Player>, via: 'telegram' }
    | { player: WithId<Player>, via: 'session', sessionId: ObjectId }

// Telegram Desktop держит окно приложения открытым днями, сутки — слишком мало
const INIT_DATA_TTL_SECONDS = 7 * 24 * 60 * 60

export function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }
  return token
}

export function getTelegramUser(req: NextRequest) {
  const raw = req.headers.get('x-init-data')
  if (!raw) {
    return null
  }
  try {
    validate(raw, botToken(), { expiresIn: INIT_DATA_TTL_SECONDS })
  }
  catch {
    throw unauthorized('Данные Telegram устарели, перезапустите приложение', TELEGRAM_EXPIRED)
  }
  const user = parse(raw).user
  if (!user?.id) {
    throw unauthorized()
  }
  return user
}

export async function getAuth(req: NextRequest): Promise<Auth | null> {
  // Если заголовок Telegram пришёл, используем только его, даже если он невалиден
  const telegramUser = getTelegramUser(req)
  if (telegramUser) {
    const player = await (await getDb()).players.findOne({ telegramId: Number(telegramUser.id) })
    return player ? { player, via: 'telegram' } : null
  }
  const found = await findSession(req)
  return found ? { player: found.player, via: 'session', sessionId: found.session._id } : null
}

export async function requireAuth(req: NextRequest): Promise<Auth> {
  const auth = await getAuth(req)
  if (!auth) {
    throw unauthorized()
  }
  return auth
}

// Находит игрока по данным Telegram или регистрирует нового; имя и фото обновляются при каждом входе
export async function registerTelegramPlayer(req: NextRequest): Promise<WithId<Player>> {
  const user = getTelegramUser(req)
  if (!user) {
    throw unauthorized()
  }
  const profile: Partial<Player> = {
    username: user.username ?? '',
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
  }
  if (user.photo_url) {
    profile.avatarUrl = user.photo_url
  }
  // Отказ отсюда не узнать: флага нет и у тех, кто просто запускал бота
  if (user.allows_write_to_pm) {
    profile.botCanWrite = true
  }
  const player = await (await getDb()).players.findOneAndUpdate(
    { telegramId: Number(user.id) },
    { $set: profile, $setOnInsert: { telegramId: Number(user.id), createdAt: Date.now() } },
    { upsert: true, returnDocument: 'after' },
  )
  if (!player) {
    throw new Error('Failed to register player')
  }
  return player
}
