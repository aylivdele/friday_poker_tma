// Операции над идущей игрой. Применяются на сервере к свежему состоянию из базы и на клиенте —
// для мгновенного отклика. Поэтому одновременные правки с разных телефонов сливаются, а не затирают друг друга.

export interface GameSettingsShape {
  isFinal: boolean
  firstEntryCost: number
  reEntryCost: number
  maxReEntries: number
  prizeFund?: number
}

export interface EditableGame {
  title: string
  createdAt: number
  // entries — число докупов (повторных входов); всего входов у игрока entries + 1
  players: { playerId: string, entries: number }[]
  settings: GameSettingsShape
}

export type GameOp
  = | { type: 'addPlayer', playerId: string }
    | { type: 'removePlayer', playerId: string }
    // from — сколько докупов видел пользователь, to — сколько стало. Если на сервере уже to — повтор, если не from — конфликт
    | { type: 'setEntries', playerId: string, from: number, to: number }
    | { type: 'setSettings', settings: Partial<GameSettingsShape> }
    | { type: 'setMeta', title?: string, createdAt?: number }

export class GameOpError extends Error {
  constructor(public kind: 'conflict' | 'invalid', message: string) {
    super(message)
  }
}

export interface GameOpContext {
  // сколько всего входов доступно каждому игроку при данных настройках
  capsFor: (settings: GameSettingsShape) => Record<string, number>
  // можно ли добавить игрока в игру (участник группы)
  canAdd: (playerId: string) => boolean
}

const invalid = (message: string) => new GameOpError('invalid', message)
const conflict = (message: string) => new GameOpError('conflict', message)

function applyOp(game: EditableGame, op: GameOp, ctx: GameOpContext): EditableGame {
  switch (op.type) {
    case 'addPlayer': {
      if (game.players.some(p => p.playerId === op.playerId)) {
        return game
      }
      if (!ctx.canAdd(op.playerId)) {
        throw invalid('В игру можно добавлять только участников группы')
      }
      if ((ctx.capsFor(game.settings)[op.playerId] ?? 0) < 1) {
        throw invalid('Игрок не проходит в финал: мало входов за сезон')
      }
      return { ...game, players: [...game.players, { playerId: op.playerId, entries: 0 }] }
    }

    case 'removePlayer':
      return { ...game, players: game.players.filter(p => p.playerId !== op.playerId) }

    case 'setEntries': {
      const player = game.players.find(p => p.playerId === op.playerId)
      if (!player) {
        throw conflict('Игрока уже убрали из игры')
      }
      if (player.entries === op.to) {
        return game
      }
      if (player.entries !== op.from) {
        throw conflict('Входы этого игрока уже изменили на другом устройстве')
      }
      if (!Number.isInteger(op.to) || op.to < 0) {
        throw invalid('Некорректное число входов')
      }
      const cap = ctx.capsFor(game.settings)[op.playerId] ?? 0
      if (op.to > player.entries && op.to + 1 > cap) {
        throw invalid(`Не больше ${cap} входов`)
      }
      return { ...game, players: game.players.map(p => p.playerId === op.playerId ? { ...p, entries: op.to } : p) }
    }

    case 'setSettings': {
      const settings = { ...game.settings, ...op.settings }
      // Лимиты проверяем, только если они меняются: старые игры могли выйти за нынешние правила
      if (settings.maxReEntries !== game.settings.maxReEntries || settings.isFinal !== game.settings.isFinal) {
        const caps = ctx.capsFor(settings)
        const over = game.players.find(p => p.entries + 1 > (caps[p.playerId] ?? 0))
        if (over) {
          throw invalid(settings.isFinal && !game.settings.isFinal
            ? 'Нельзя сделать игру финалом: у кого-то входов больше, чем позволяет лимит финала'
            : `Нельзя: у игрока уже ${over.entries + 1} входов`)
        }
      }
      return { ...game, settings }
    }

    case 'setMeta': {
      const title = op.title?.trim()
      if (op.title !== undefined && !title) {
        throw invalid('Название не может быть пустым')
      }
      return { ...game, title: title ?? game.title, createdAt: op.createdAt ?? game.createdAt }
    }
  }
}

export function applyOps(game: EditableGame, ops: GameOp[], ctx: GameOpContext): EditableGame {
  return ops.reduce((state, op) => applyOp(state, op, ctx), game)
}
