// Демо-данные для локальной разработки без Telegram.
// Запуск: pnpm tsx --env-file=.env scripts/seed.ts
// Вход: телефон +7 999 000-00-01, пароль demo-password
import type { Game, Player } from '@/types/db'
import process from 'node:process'
import { ObjectId } from 'mongodb'
import { getDb } from '@/core/db'
import { recalculateAllAchievments } from '@/lib/achievments'
import { runMigrations } from '@/server/migrations'
import { hashPassword } from '@/server/password'

const DEMO_PHONE = '79990000001'
const DEMO_PASSWORD = 'demo-password'

async function main() {
  const host = process.env.MONGODB_HOST ?? ''
  if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--force')) {
    throw new Error(`База ${host} не локальная. Если вы уверены, добавьте --force`)
  }

  const db = await getDb()
  await runMigrations()
  if (await db.players.findOne({ phone: DEMO_PHONE })) {
    console.log('Демо-данные уже есть')
    return
  }

  const settings = { isFinal: false, firstEntryCost: 100, reEntryCost: 100, maxReEntries: 5 }
  const now = Date.now()
  const day = (offset: number) => {
    const d = new Date()
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() - offset)
  }

  const players: (Player & { _id: ObjectId })[] = [
    { _id: new ObjectId(), telegramId: 900000001, firstName: 'Демо', lastName: 'Игрок', username: 'demo', phone: DEMO_PHONE, passwordHash: await hashPassword(DEMO_PASSWORD), createdAt: now },
    { _id: new ObjectId(), telegramId: 900000002, firstName: 'Вася', lastName: 'Пупкин', createdAt: now },
    { _id: new ObjectId(), firstName: 'Петя', lastName: '', createdAt: now },
  ]
  const [demo, vasya, petya] = players
  const groupId = new ObjectId()
  const seasonId = new ObjectId()
  const games: (Game & { _id: ObjectId })[] = [
    {
      _id: new ObjectId(),
      groupId,
      seasonId,
      title: 'Первая пятница',
      createdAt: day(7),
      creater: demo._id,
      settings,
      isFinished: true,
      finishedAt: now,
      players: [{ playerId: demo._id, entries: 1 }, { playerId: vasya._id, entries: 0 }, { playerId: petya._id, entries: 2 }],
      results: [{ playerId: demo._id, score: 4 }, { playerId: vasya._id, score: 2 }],
      rev: 0,
    },
    {
      _id: new ObjectId(),
      groupId,
      seasonId,
      title: 'Вторая пятница',
      createdAt: day(0),
      creater: demo._id,
      settings,
      isFinished: false,
      players: [{ playerId: demo._id, entries: 0 }, { playerId: vasya._id, entries: 1 }],
      rev: 0,
    },
  ]

  await db.players.insertMany(players)
  await db.groups.insertOne({ _id: groupId, title: 'Демо-группа', ownerId: demo._id, members: players.map(p => p._id), pin: '0000', createdAt: now })
  await db.seasons.insertOne({ _id: seasonId, groupId, title: 'Демо-сезон', gameIds: games.map(g => g._id) })
  await db.games.insertMany(games)
  await recalculateAllAchievments()

  console.log(`Готово. Вход: телефон +7 999 000-00-01, пароль ${DEMO_PASSWORD}; PIN группы 0000`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
