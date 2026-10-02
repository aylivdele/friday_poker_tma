/* ===== Player ===== */
export interface Player {
  _id: string
  hasTelegram: boolean
  username?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  createdAt: number
  achievments?: Pick<Achievment, 'id' | 'progress'>[]
}

// Свой профиль: что нужно для входа из браузера
export interface Me extends Player {
  authVia: 'telegram' | 'session'
  hasPassword: boolean
  // маскированный номер, если подтверждён
  phone: string | null
}

/* ===== Group ===== */
export interface GroupAbilities {
  join: boolean
  leave: boolean
  delete: boolean
  // создавать сезоны, игры и виртуальных игроков
  manage: boolean
}

export interface Group {
  _id: string
  title: string
  ownerId: string
  members: string[]
  createdAt: number
  can: GroupAbilities
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

export interface GameAbilities {
  edit: boolean
  finish: boolean
  delete: boolean
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
  creater?: string
  rev: number
}

export interface GameDetails extends Game {
  can: GameAbilities
  // сколько всего входов доступно каждому участнику группы в этой игре
  caps: Record<string, number>
}

/* ===== Season ===== */
export interface SeasonAbilities {
  createGame: boolean
  delete: boolean
}

export interface Season {
  _id: string
  groupId: string
  title: string
  gameIds: string[]
  can: SeasonAbilities
}

export interface SeasonTable {
  games: {
    _id: string
    title: string
    isFinal?: boolean
  }[]
  cells: Record<string, Record<string, number>>
  totals: Record<string, number>
  finalWinners: string[]
  seasonPlaces: Record<string, 1 | 2 | 3>
  seasonEntries: Record<string, number>
  updatedAt: number
}

export interface SeasonTableResponse extends SeasonTable {
  players: Player[]
}

export interface Achievment {
  id: string
  icon: string
  name: string
  description: string
  maxProgress: number
  progress: [number, number]
  isSecret?: boolean
}
