import { getDb } from '@/core/db'

// Индексы создаются при старте сервера. Ошибка (например, дубли в данных) не роняет приложение,
// а только пишется в лог
export async function runMigrations() {
  const db = await getDb()
  try {
    await db.players.createIndex(
      { telegramId: 1 },
      { unique: true, partialFilterExpression: { telegramId: { $type: 'number' } } },
    )
  }
  catch (e) {
    console.error('Migration failed: unique index on players.telegramId (есть дубли telegramId?)', e)
  }
}
