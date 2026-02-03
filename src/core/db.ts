import type { Db } from 'mongodb'
import type { Game, Group, MongoCollections, Player, Season } from '@/types/db'
import process from 'node:process'
import { MongoClient } from 'mongodb'

const uri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST ?? 'localhost'}:${process.env.MONGODB_PORT ?? 27017}/${process.env.MONGODB_DBNAME}?authSource=admin`
const options = {}

let client: MongoClient

let _mongoClientPromise: Promise<MongoClient> | undefined

if (!_mongoClientPromise) {
  client = new MongoClient(uri, options)
  _mongoClientPromise = client.connect()
}

let db: Db | null = null

export function getCollections(db: Db): MongoCollections {
  return {
    players: db.collection<Player>('players'),
    groups: db.collection<Group>('groups'),
    games: db.collection<Game>('games'),
    seasons: db.collection<Season>('seasons'),
  }
}

export async function getDb(): Promise<MongoCollections> {
  if (db)
    return getCollections(db)
  const client = await _mongoClientPromise!
  db = client.db()
  return getCollections(db)
}
