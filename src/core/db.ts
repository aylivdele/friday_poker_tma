import type { Db } from 'mongodb'
import type { Game, Group, MongoCollectionsWithClient, Player, Season } from '@/types/db'
import process from 'node:process'
import { MongoClient } from 'mongodb'

function getMongoUri() {
  return `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DBNAME}?authSource=admin`
}

let _mongoClientPromise: Promise<MongoClient> | undefined
let db: Db | null = null

export async function getDb(): Promise<MongoCollectionsWithClient> {
  if (db)
    return getCollections(db)

  if (!_mongoClientPromise) {
    const uri = getMongoUri()
    console.error(uri)
    const client = new MongoClient(uri)
    _mongoClientPromise = client.connect()
  }

  const client = await _mongoClientPromise
  db = client.db()
  return getCollections(db)
}

export function getCollections(db: Db): MongoCollectionsWithClient {
  return {
    players: db.collection<Player>('players'),
    groups: db.collection<Group>('groups'),
    games: db.collection<Game>('games'),
    seasons: db.collection<Season>('seasons'),
    client: db,
  }
}
