import { getDb } from '@/core/db'

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
}
