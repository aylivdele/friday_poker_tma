import type { Collection, Db, ObjectId } from 'mongodb'

/* ===== Player ===== */
export interface Player {
  _id?: ObjectId
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
  createdAt: Date
}

/* ===== Group ===== */
export interface Group {
  _id?: ObjectId
  name: string
  ownerId: ObjectId
  members: ObjectId[]
  createdAt: Date
}

/* ===== Game ===== */
export interface GamePlayer {
  playerId: ObjectId
  entries: number
}

export interface GameResult {
  playerId: ObjectId
  score: number
}

export interface Game {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  isFinished: boolean
  players: GamePlayer[]
  results?: GameResult[]
  createdAt: Date
  finishedAt?: Date
}

export interface MongoCollections {
  players: Collection<Player>
  groups: Collection<Group>
  games: Collection<Game>
}

export type ExtendedDb = Db & MongoCollections
