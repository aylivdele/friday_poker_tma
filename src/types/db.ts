import type { Collection, Db, ObjectId } from 'mongodb'
import type { Achievment } from './api'
import type { Appearance } from '@/lib/appearance'

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
  // только цифры, подтверждён через Telegram; используется для входа из браузера
  phone?: string
  passwordHash?: string
  // выбранное оформление, общее для Telegram и браузера
  appearance?: Appearance
}

/* ===== Session ===== */
export interface Session {
  _id?: ObjectId
  playerId: ObjectId
  // в базе только хеш токена: утечка базы не даёт войти по чужой сессии
  tokenHash: string
  createdAt: Date
  expiresAt: Date
  lastSeenAt: Date
  userAgent?: string
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
  creater?: ObjectId
  // счётчик версий для защиты от потери изменений при одновременной правке
  rev?: number
  // когда и кем игра менялась последний раз
  updatedAt?: number
  updatedBy?: ObjectId
}

export interface Season {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  gameIds: ObjectId[]
}

export interface MongoCollectionsWithClient {
  players: Collection<Player>
  groups: Collection<Group>
  games: Collection<Game>
  seasons: Collection<Season>
  sessions: Collection<Session>
  client: Db
}
