import type { ObjectId } from 'mongodb'
import type { Achievment } from '@/types/api'
import type { Game, Player } from '@/types/db'
import { getDb } from '@/core/db'
import { nonNull } from './helpers'

type Checker = (params: { player: Player, game: Game, seasonGames: Game[] }) => Achievment['progress']
const possibleAchievments: (Omit<Achievment, 'progress'> & { getNewProgress: Checker, maxProgress: number })[] = [
  {
    id: '0',
    icon: '',
    name: 'Посвещение',
    description: 'Сыграть первую игру',
    maxProgress: 1,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Новичек',
    description: 'Сыграть пятую игру',
    maxProgress: 5,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Любитель',
    maxProgress: 10,
    description: 'Сыграть десятую игру',
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Бывалый',
    description: 'Сыграть пятнадцатую игру',
    maxProgress: 15,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Потеря девственности',
    description: 'Закончить в плюсе в первый раз',
    maxProgress: 1,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const entries = game.players.find(p => p.playerId.equals(player._id))?.entries ?? 0
      const result = game.results?.find(p => p.playerId.equals(player._id))
      if (result && result.score > (entries + 1))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '5',
    icon: '',
    name: 'Красаучик',
    description: 'Закончить в плюсе две игры подряд',
    maxProgress: 2,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const entries = game.players.find(p => p.playerId.equals(player._id))?.entries ?? 0
      const result = game.results?.find(p => p.playerId.equals(player._id))
      if (result && result.score > (entries + 1))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '6',
    icon: '',
    name: 'Молодчик',
    description: 'Закончить в плюсе три игры подряд',
    maxProgress: 3,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const entries = game.players.find(p => p.playerId.equals(player._id))?.entries ?? 0
      const result = game.results?.find(p => p.playerId.equals(player._id))
      if (result && result.score > (entries + 1))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '7',
    icon: '',
    name: 'На скиле',
    description: 'Закончить в плюсе пять игр подряд',
    maxProgress: 5,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const hasPlayed = game.players.some(p => p.playerId.equals(player._id))
      if (!hasPlayed) {
        return progress
      }
      const entries = game.players.find(p => p.playerId.equals(player._id))?.entries ?? 0
      const result = game.results?.find(p => p.playerId.equals(player._id))
      if (result && result.score > (entries + 1))
        return [progress[0] + 1, this.maxProgress]
      return [0, this.maxProgress]
    },
  },
  {
    id: '8',
    icon: '',
    name: 'Просто повезло',
    description: 'Первый раз выиграть финальную игру сезона',
    maxProgress: 1,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const isWonFinal = game.settings.isFinal && game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      return [progress[0] + +!!isWonFinal, this.maxProgress]
    },
  },
  {
    id: '9',
    icon: '',
    name: 'Чемпион',
    description: 'Второй раз выиграть финальную игру сезона',
    maxProgress: 2,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const isWonFinal = game.settings.isFinal && game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      return [progress[0] + +!!isWonFinal, this.maxProgress]
    },
  },
  {
    id: '10',
    icon: '',
    name: 'Легенда',
    description: 'Третий раз выиграть финальную игру сезона',
    maxProgress: 3,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const isWonFinal = game.settings.isFinal && game.results?.some(p => p.playerId.equals(player._id) && p.score > 0)
      return [progress[0] + +!!isWonFinal, this.maxProgress]
    },
  },
  {
    id: '11',
    icon: '',
    name: 'Все бывает впервые',
    description: 'Первый раз проиграть',
    maxProgress: 1,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Закономерность?',
    description: 'Проиграть третий раз подряд',
    maxProgress: 3,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Ебать ты лох',
    description: 'Проиграть шестой раз подряд',
    maxProgress: 6,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Бро, тебе надо тренироваться',
    description: 'Проиграть десятый раз подряд',
    maxProgress: 10,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Солеварня',
    description: 'Забрать весь выигрышь на обычной игре',
    maxProgress: 1,
    getNewProgress({ player, game }) {
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
    icon: '',
    name: 'Постоялец',
    description: 'Посетить все игры сезона',
    maxProgress: 1,
    getNewProgress({ player, game, seasonGames }) {
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
    icon: '',
    name: 'Копил ману',
    description: 'Выиграть финальную игру, проиграв все остальные',
    maxProgress: 1,
    getNewProgress({ player, game, seasonGames }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      if (!game.settings.isFinal || !game.results?.some(p => p.playerId.equals(player._id))) {
        return [0, this.maxProgress]
      }
      const lostOthers = seasonGames.reduce((acc, g) => acc && (g.settings.isFinal || !g.results?.some(p => p.playerId.equals(player._id))), true)

      return [+lostOthers, this.maxProgress]
    },
  },
  {
    id: '18',
    icon: '',
    name: 'Проще простого',
    description: 'Выиграть без докупов',
    maxProgress: 1,
    getNewProgress({ player, game }) {
      const achievmentId = this.id
      const progress = player.achievments?.find(a => a.id === achievmentId)?.progress || [0, this.maxProgress]
      if (progress[0] === this.maxProgress) {
        return progress
      }
      const wonWithoutEntries = game.players.some(p => p.playerId.equals(player._id) && p.entries === 0)
        && game.results?.some(r => r.playerId.equals(player._id) && r.score > 1)
      return [+!!wonWithoutEntries, this.maxProgress]
    },
  },
]

export async function updateAchievments(gameId: ObjectId) {
  const db = await getDb()
  const game = await db.games.findOne({ _id: gameId })
  if (!game)
    return
  const groupPlayersIds = await db.groups.findOne({ _id: game.groupId }, { projection: { members: 1 } })
  if (!groupPlayersIds)
    return
  const groupPlayers = await db.players.find({ _id: { $in: groupPlayersIds.members } }).toArray()

  const seasonGames = nonNull(game.seasonId) ? await db.games.find({ seasonId: game.seasonId }).toArray() : []
  for (const player of groupPlayers) {
    const newAchievments = possibleAchievments.map(a => ({ id: a.id, progress: a.getNewProgress({ player, game, seasonGames }) }))
    await db.players.updateOne({ _id: player._id }, { $set: { achievments: newAchievments } })
  }
}
