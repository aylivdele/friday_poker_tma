import type { ExtendedDb } from '@/types/types'
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

let db: ExtendedDb | null = null

export async function getDb(): Promise<ExtendedDb> {
  if (db)
    return db
  const client = await _mongoClientPromise!
  db = client.db() as ExtendedDb
  return db
}
