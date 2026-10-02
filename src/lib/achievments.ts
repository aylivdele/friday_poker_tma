import type { ObjectId, WithId } from 'mongodb'
import type { Achievment } from '@/types/api'
import type { Game, Player } from '@/types/db'
import { getDb } from '@/core/db'
import { calcGameBalances, getGameWinners } from '@/domain/balances'
import { nonNull } from './helpers'

type Checker = (params: { player: Player, game: Game, seasonGames: Game[] }) => Achievment['progress']

// Победитель финала определяется так же, как 🏆 в таблице сезона
function isFinalWinner(game: Game, playerId?: ObjectId) {
  return game.settings.isFinal && nonNull(playerId) && getGameWinners(game).includes(playerId.toString())
}

// «В плюсе» — по деньгам, тем же расчётом, что и таблица сезона
function isInPlus(game: Game, playerId?: ObjectId) {
  return nonNull(playerId) && (calcGameBalances(game)[playerId.toString()] ?? 0) > 0
}

const secretAchievments: Omit<Achievment, 'progress'>[] = [
  {
    id: '-1',
    icon: '💩',
    name: 'Пожрал говна',
    description: 'Участвовал в альфа-тесте',
    maxProgress: 1,
    isSecret: true,
  },
  {
    id: '-2',
    icon: '😎',
    name: 'Hackerman',
    description: 'Единственный разработчик этого чуда',
    maxProgress: 1,
    isSecret: true,
  },
]

const possibleAchievments: (Omit<Achievment, 'progress'> & { calcNewProgress: Checker })[] = [
  {
    id: '0',
    icon: '🐣',
    name: 'Посвящение',
    description: 'Сыграть первую игру',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      return [+hasPlayed, this.maxProgress]
    },
  },
  {
    id: '1',
    icon: '🔰',
    name: 'Новичок',
    description: 'Сыграть пятую игру',
    maxProgress: 5,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      return [progress[0] + +hasPlayed, this.maxProgress]
    },
  },
  {
    id: '2',
    icon: '🎮',
    name: 'Любитель',
    maxProgress: 10,
    description: 'Сыграть десятую игру',
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      return [progress[0] + +hasPlayed, this.maxProgress]
    },
  },
  {
    id: '3',
    icon: '🧭',
    name: 'Бывалый',
    description: 'Сыграть пятнадцатую игру',
    maxProgress: 15,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      return [progress[0] + +hasPlayed, this.maxProgress]
    },
  },
  {
    id: '19',
    icon: '👴',
    name: 'Олд',
    description: 'Сыграть тридцатую игру',
    maxProgress: 30,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      return [progress[0] + +hasPlayed, this.maxProgress]
    },
  },
  {
    id: '4',
    icon: '💸',
    name: 'Потеря девственности',
    description: 'Закончить в плюсе в первый раз',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      if (isInPlus(game, player._id))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '5',
    icon: '✌️',
    name: 'Красавчик',
    description: 'Закончить в плюсе две игры подряд',
    maxProgress: 2,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      if (isInPlus(game, player._id))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '6',
    icon: '🔥',
    name: 'Молодчик',
    description: 'Закончить в плюсе три игры подряд',
    maxProgress: 3,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      if (isInPlus(game, player._id))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '7',
    icon: '⚡',
    name: 'На скиле',
    description: 'Закончить в плюсе пять игр подряд',
    maxProgress: 5,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      if (isInPlus(game, player._id))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '8',
    icon: '🍀',
    name: 'Просто повезло',
    description: 'Первый раз выиграть финальную игру сезона',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      return [progress[0] + +isFinalWinner(game, player._id), this.maxProgress]
    },
  },
  {
    id: '9',
    icon: '🏆',
    name: 'Чемпион',
    description: 'Второй раз выиграть финальную игру сезона',
    maxProgress: 2,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      return [progress[0] + +isFinalWinner(game, player._id), this.maxProgress]
    },
  },
  {
    id: '10',
    icon: '👑',
    name: 'Легенда',
    description: 'Третий раз выиграть финальную игру сезона',
    maxProgress: 3,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      return [progress[0] + +isFinalWinner(game, player._id), this.maxProgress]
    },
  },
  {
    id: '11',
    icon: '🌧️',
    name: 'Все бывает впервые',
    description: 'Первый раз проиграть',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const isLost = game.players.some(p => p.playerId.equals(player._id)) && !game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      return [progress[0] + +!!isLost, this.maxProgress]
    },
  },
  {
    id: '12',
    icon: '💀',
    name: 'Закономерность?',
    description: 'Проиграть третий раз подряд',
    maxProgress: 3,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const isLost = !game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      if (!isLost) {
        return [0, this.maxProgress]
      }
      return [progress[0] + +!!isLost, this.maxProgress]
    },
  },
  {
    id: '13',
    icon: '🤡',
    name: 'Ебать ты лох',
    description: 'Проиграть шестой раз подряд',
    maxProgress: 6,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const isLost = !game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      if (!isLost) {
        return [0, this.maxProgress]
      }
      return [progress[0] + +!!isLost, this.maxProgress]
    },
  },
  {
    id: '14',
    icon: '🪦',
    name: 'Бро, тебе надо тренироваться',
    description: 'Проиграть десятый раз подряд',
    maxProgress: 10,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const isLost = !game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      if (!isLost) {
        return [0, this.maxProgress]
      }
      return [progress[0] + +!!isLost, this.maxProgress]
    },
  },
  {
    id: '15',
    icon: '🧂',
    name: 'Солеварня',
    description: 'Забрать весь выигрыш на обычной игре',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const isSolo = !game.settings.isFinal && game.results?.length === 1 && game.results[0].playerId.equals(player._id)

      return [progress[0] + +isSolo, this.maxProgress]
    },
  },
  {
    id: '16',
    icon: '📅',
    name: 'Постоялец',
    description: 'Посетить все игры сезона',
    maxProgress: 1,
    calcNewProgress({ player, game, seasonGames }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const visitedAll = game.settings.isFinal
        && game.players.some(p => p.playerId.equals(player._id))
        && seasonGames.reduce((acc, g) => acc && g.players.some(p => p.playerId.equals(player._id)), true)

      return [progress[0] + +visitedAll, this.maxProgress]
    },
  },
  {
    id: '17',
    icon: '🧘‍♂️',
    name: 'Копил ману',
    description: 'Выиграть финал, проиграв остальные игры',
    maxProgress: 1,
    calcNewProgress({ player, game, seasonGames }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      if (!isFinalWinner(game, player._id)) {
        return [0, this.maxProgress]
      }
      const lostOthers = seasonGames.reduce((acc, g) => acc && (g.settings.isFinal || !g.results?.some(p => p.playerId.equals(player._id))), true)

      return [+lostOthers, this.maxProgress]
    },
  },
  {
    id: '18',
    icon: '🎯',
    name: 'Проще простого',
    description: 'Выиграть без докупов',
    maxProgress: 1,
    calcNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const wonWithoutEntries = game.players.some(p => p.playerId.equals(player._id) && p.entries === 0)
        && isInPlus(game, player._id)
      return [+!!wonWithoutEntries, this.maxProgress]
    },
  },
]

// Прогресс всегда пересчитывается с нуля по всем завершённым играм игрока.
// Инкрементальное обновление не идемпотентно: повторное сохранение завершённой игры засчитывало её ещё раз.
export async function recalculateAchievments(players: ObjectId[]) {
  for (const playerId of players) {
    await fullUpdateAchievments(playerId)
  }
}

export async function recalculateAllAchievments() {
  const db = await getDb()
  const players = await db.players.find({}, { projection: { _id: 1 } }).toArray()
  await recalculateAchievments(players.map(p => p._id))
}

export async function fullUpdateAchievments(playerId: ObjectId) {
  const db = await getDb()
  const player = await db.players.findOne({ _id: playerId })
  if (!player) {
    return
  }
  const games = await db.games.find({ $and: [{ 'players.playerId': player._id }, { isFinished: true }] }).sort({ createdAt: 1, _id: 1 }).toArray()
  let achievs: Player['achievments'] = []
  const oldSecretAchievments = player.achievments?.filter(a => secretAchievments.some(s => s.id === a.id && a.progress[0] === s.maxProgress)) ?? []

  for (const game of games) {
    const seasonGames = nonNull(game.seasonId) ? await db.games.find({ $and: [{ seasonId: game.seasonId }, { isFinished: true }, { createdAt: { $lt: game.createdAt } }] }).toArray() : []

    const updatedPlayer: WithId<Player> = { ...player, achievments: achievs }
    const newAchievments = possibleAchievments.map(a => ({ id: a.id, progress: a.calcNewProgress({ player: updatedPlayer, game, seasonGames }) }))
    achievs = newAchievments
  }

  await db.players.updateOne({ _id: player._id }, { $set: { achievments: [...oldSecretAchievments, ...achievs] } })
}

export function getAchievmentsInfo(): Omit<Achievment, 'progress'>[] {
  return [...possibleAchievments.map(a => ({ ...a, calcNewProgress: undefined })), ...secretAchievments]
}

export function getAchievments(playerAchievments: Player['achievments']) {
  const result: Achievment[] = [...possibleAchievments.map((a) => {
    const progress = playerAchievments?.find(pa => pa.id === a.id)?.progress ?? [0, a.maxProgress]
    return { ...a, calcNewProgress: undefined, progress }
  })]
  result.push(...secretAchievments.map((s) => {
    const found = playerAchievments?.find(p => p.id === s.id && p.progress[0] === p.progress[1])
    if (found) {
      return { ...s, progress: found.progress }
    }
    return null
  }).filter(nonNull))
  return result
}
