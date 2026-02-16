/* ===== Player ===== */
export interface Player {
  _id: string
  telegramId?: number
  username?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  createdAt: number
}

/* ===== Group ===== */
export interface Group {
  _id: string
  title: string
  ownerId: string
  members: string[]
  createdAt: number
}

/* ===== Game ===== */
export interface GamePlayer {
  playerId: string
  entries: number
}

export interface GameResult {
  playerId: string
  score: number
}

export interface GameSettings {
  isFinal: boolean
  firstEntryCost: number
  reEntryCost: number
  maxReEntries: number
}

export interface Game {
  _id: string
  groupId: string
  title: string
  isFinished: boolean
  players: GamePlayer[]
  results?: GameResult[]
  createdAt: number
  finishedAt?: number
  seasonId?: string
  settings: GameSettings
}

export interface Season {
  _id: string
  groupId: string
  title: string
  gameIds: string[]
}

export interface SeasonTableResponse {
  players: Player[]
  games: {
    _id: string
    title: string
    isFinal?: boolean
  }[]
  cells: Record<string, Record<string, number>>
  totals: Record<string, number>
  finalWinners: string[]
  seasonPlaces: Record<string, 1 | 2 | 3>
}
