import { getDb } from '@/core/db'
import { collectedPrizeFund } from './games'

async function step(name: string, run: () => Promise<unknown>) {
  try {
    await run()
  }
  catch (e) {
    console.error(`Migration failed: ${name}`, e)
  }
}

// Индексы создаются при старте сервера. Ошибка (например, дубли в данных) не роняет приложение,
// а только пишется в лог
export async function runMigrations() {
  const db = await getDb()
  await step('unique index on players.telegramId (есть дубли telegramId?)', () => db.players.createIndex(
    { telegramId: 1 },
    { unique: true, partialFilterExpression: { telegramId: { $type: 'number' } } },
  ))
  await step('unique index on players.phone', () => db.players.createIndex(
    { phone: 1 },
    { unique: true, partialFilterExpression: { phone: { $type: 'string' } } },
  ))
  await step('unique index on sessions.tokenHash', () => db.sessions.createIndex({ tokenHash: 1 }, { unique: true }))
  await step('TTL index on sessions.expiresAt', () => db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }))
  await step('index on sessions.playerId', () => db.sessions.createIndex({ playerId: 1 }))
  await step('prize fund of finals created before it existed', () => fillMissingPrizeFunds())
}

/*
 * Взнос в фонд с обычных игр считается и для старых игр (по умолчанию 10%), значит и старым финалам
 * нужен фонд — иначе собранное пропало бы из итогов. Ставим собранное за сезон; реальную сумму
 * (с процентами по вкладу) можно поправить в «Исправить итоги». Финалы, где фонд уже указан, не трогаем.
 */
async function fillMissingPrizeFunds() {
  const db = await getDb()
  const finals = await db.games.find({ 'settings.isFinal': true, 'settings.prizeFund': { $exists: false }, 'seasonId': { $exists: true } }).toArray()
  for (const final of finals) {
    const prizeFund = await collectedPrizeFund(final.seasonId!)
    await db.games.updateOne({ '_id': final._id, 'settings.prizeFund': { $exists: false } }, { $set: { 'settings.prizeFund': prizeFund } })
  }
  if (finals.length > 0) {
    console.warn(`Prize fund filled for ${finals.length} final game(s)`)
  }
}
