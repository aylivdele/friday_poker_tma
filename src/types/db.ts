import type { Collection, Db, ObjectId } from 'mongodb'
import type { Achievment, SeasonTable } from './api'

/* ===== Player ===== */
export interface Player {
  _id?: ObjectId
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  createdAt: number
  achievments?: Pick<Achievment, 'id' | 'progress'>[]
}

/* ===== Group ===== */
export interface Group {
  _id?: ObjectId
  title: string
  ownerId: ObjectId
  members: ObjectId[]
  createdAt: number
  pin?: string
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

export interface GameSettings {
  isFinal: boolean
  firstEntryCost: number
  reEntryCost: number
  maxReEntries: number
}

export interface Game {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  isFinished: boolean
  players: GamePlayer[]
  results?: GameResult[]
  createdAt: number
  finishedAt?: number
  seasonId?: ObjectId
  settings: GameSettings
}

export interface Season {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  gameIds: ObjectId[]
  table?: SeasonTable
}

export interface MongoCollectionsWithClient {
  players: Collection<Player>
  groups: Collection<Group>
  games: Collection<Game>
  seasons: Collection<Season>
  client: Db
}
