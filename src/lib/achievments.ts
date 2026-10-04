import type { ObjectId, WithId } from 'mongodb'
import type { Achievment } from '@/types/api'
import type { Game, Player } from '@/types/db'
import { getDb } from '@/core/db'
import { calcEntryCaps, calcGameBalances, getGameWinners } from '@/domain/balances'
import { buildSeasonTable } from '@/domain/seasonTable'
import { roundBalances } from '@/domain/settlement'
import { nonNull } from './helpers'

type Progress = Achievment['progress']
type AchievmentInfo = Omit<Achievment, 'progress' | 'earnedShare'>

interface CheckParams {
  player: Player
  game: Game
  // завершённые игры сезона до этой
  seasonGames: Game[]
  // завершённые игры игрока до этой, по порядку
  history: Game[]
}
type Checker = (params: CheckParams) => Progress
type AchievmentDef = AchievmentInfo & { calcNewProgress: Checker }

// Победитель финала определяется так же, как 🏆 в таблице сезона
function isFinalWinner(game: Game, playerId?: ObjectId) {
  return game.settings.isFinal && nonNull(playerId) && getGameWinners(game).includes(playerId.toString())
}

// «В плюсе» — по деньгам, тем же расчётом, что и таблица сезона
function isInPlus(game: Game, playerId?: ObjectId) {
  return nonNull(playerId) && (calcGameBalances(game)[playerId.toString()] ?? 0) > 0
}

function hasPlayed(game: Game, playerId?: ObjectId) {
  return nonNull(playerId) && game.players.some(p => p.playerId.equals(playerId))
}

// «Проиграл» — как в старых достижениях: закончил без стеков
function isLost(game: Game, playerId?: ObjectId) {
  return hasPlayed(game, playerId) && !game.results?.some(r => r.playerId.equals(playerId!) && r.score > 0)
}

// Итоги игры в целых рублях — как на экране игры и в сообщениях бота
function gameRubles(game: Game) {
  return roundBalances(calcGameBalances(game))
}

function reEntries(game: Game, playerId?: ObjectId) {
  return game.players.find(p => nonNull(playerId) && p.playerId.equals(playerId))?.entries ?? 0
}

// Сделал все докупы, какие ему были доступны в этой игре (в финале лимит зависит от сезона)
function usedAllEntries(game: Game, seasonGames: Game[], playerId?: ObjectId) {
  if (!nonNull(playerId)) {
    return false
  }
  const entries = reEntries(game, playerId)
  const cap = calcEntryCaps(game, [playerId.toString()], seasonGames)[playerId.toString()] ?? 0
  return entries > 0 && entries + 1 >= cap
}

function lifetimeRubles({ player, game, history }: CheckParams) {
  return [...history, game].reduce((acc, g) => acc + (nonNull(player._id) ? gameRubles(g)[player._id.toString()] ?? 0 : 0), 0)
}

const moscowClock = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', weekday: 'short', hour: '2-digit', hourCycle: 'h23' })

function moscowTime(timestamp: number) {
  const parts = moscowClock.formatToParts(new Date(timestamp))
  return { weekday: parts.find(p => p.type === 'weekday')?.value, hour: Number(parts.find(p => p.type === 'hour')?.value) }
}

// Пятничная игра: назначена на пятницу или закончилась до обеда субботы
function isFridayGame(game: Game) {
  if (new Date(game.createdAt).getUTCDay() === 5) {
    return true
  }
  if (!game.finishedAt) {
    return false
  }
  const { weekday, hour } = moscowTime(game.finishedAt)
  return weekday === 'Sat' && hour < 12
}

function previousProgress(player: Player, id: string, maxProgress: number): Progress {
  return player.achievments?.find(a => a.id === id)?.progress ?? [0, maxProgress]
}

// Разовое: засчитывается в первой игре, где выполнилось условие
function once(info: Omit<AchievmentInfo, 'maxProgress'>, check: (params: CheckParams) => boolean): AchievmentDef {
  return {
    ...info,
    maxProgress: 1,
    calcNewProgress(params) {
      const progress = previousProgress(params.player, info.id, 1)
      return progress[0] >= 1 ? progress : [+check(params), 1]
    },
  }
}

// Счётчик по всем играм, не обязательно подряд
function counter(info: Omit<AchievmentInfo, 'maxProgress'>, maxProgress: number, count: (params: CheckParams) => number): AchievmentDef {
  return {
    ...info,
    maxProgress,
    calcNewProgress(params) {
      const progress = previousProgress(params.player, info.id, maxProgress)
      return progress[0] >= maxProgress ? progress : [Math.min(progress[0] + count(params), maxProgress), maxProgress]
    },
  }
}

// Порог по накопленной величине; достигнутый не теряется, даже если величина потом уменьшится
function threshold(info: Omit<AchievmentInfo, 'maxProgress'>, maxProgress: number, value: (params: CheckParams) => number): AchievmentDef {
  return {
    ...info,
    maxProgress,
    calcNewProgress(params) {
      const progress = previousProgress(params.player, info.id, maxProgress)
      return progress[0] >= maxProgress ? progress : [Math.min(Math.max(value(params), 0), maxProgress), maxProgress]
    },
  }
}

const secretAchievments: AchievmentInfo[] = [
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

const possibleAchievments: AchievmentDef[] = [
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

  // Деньги
  once({ id: '20', icon: '💰', name: 'Ночь удалась', description: 'Выиграть 1 000 ₽ за одну игру' }, ({ player, game }) =>
    (gameRubles(game)[player._id!.toString()] ?? 0) >= 1000),
  once({ id: '21', icon: '🍺', name: 'На пиво хватит', description: 'Закончить в плюсе, но не больше чем на 100 ₽' }, ({ player, game }) => {
    const rubles = gameRubles(game)[player._id!.toString()] ?? 0
    return rubles > 0 && rubles <= 100
  }),
  // Докупаются до лимита обычно многие, поэтому засчитываем, только если число докупов у игрока ни у кого больше не повторилось
  once({ id: '22', icon: '🎁', name: 'Спонсор вечера', description: 'Проиграть больше всех за игру и быть единственным с таким числом докупов' }, ({ player, game }) => {
    const rubles = gameRubles(game)
    const mine = rubles[player._id!.toString()] ?? 0
    const worst = Math.min(...Object.values(rubles))
    const entries = reEntries(game, player._id)
    return mine < 0 && mine === worst
      && Object.values(rubles).filter(v => v === worst).length === 1
      && game.players.filter(p => p.entries === entries).length === 1
  }),
  counter({ id: '23', icon: '📈', name: 'Стабильный доход', description: 'Закончить в плюсе 10 игр, не обязательно подряд' }, 10, ({ player, game }) =>
    +isInPlus(game, player._id)),
  threshold({ id: '24', icon: '🤑', name: 'Инвестор', description: 'Выйти в +5 000 ₽ за всё время', unit: 'money' }, 5000, params =>
    lifetimeRubles(params)),
  threshold({ id: '25', icon: '🕳️', name: 'Меценат', description: 'Уйти в −5 000 ₽ за всё время', unit: 'money' }, 5000, params =>
    -lifetimeRubles(params)),

  // Докупы
  once({ id: '26', icon: '🐦‍🔥', name: 'Феникс', description: 'Закончить в плюсе, сделав все возможные докупы' }, ({ player, game, seasonGames }) =>
    usedAllEntries(game, seasonGames, player._id) && isInPlus(game, player._id)),
  once({ id: '27', icon: '🏧', name: 'Банкомат', description: 'Сделать все возможные докупы и всё равно остаться без стеков' }, ({ player, game, seasonGames }) =>
    usedAllEntries(game, seasonGames, player._id) && isLost(game, player._id)),
  counter({ id: '28', icon: '💳', name: 'Кредитная история', description: 'Сделать 25 докупов за всё время' }, 25, ({ player, game }) =>
    reEntries(game, player._id)),
  counter({ id: '29', icon: '🏠', name: 'Ипотека', description: 'Сделать 50 докупов за всё время' }, 50, ({ player, game }) =>
    reEntries(game, player._id)),
  counter({ id: '30', icon: '📞', name: 'Коллекторы выехали', description: 'Сделать 100 докупов за всё время' }, 100, ({ player, game }) =>
    reEntries(game, player._id)),
  counter({ id: '31', icon: '🏦', name: 'Системо\u00ADобразующий банк', description: 'Сделать 200 докупов за всё время' }, 200, ({ player, game }) =>
    reEntries(game, player._id)),
  once({ id: '32', icon: '🧊', name: 'Хладнокровный', description: 'Выиграть финал без докупов' }, ({ player, game }) =>
    isFinalWinner(game, player._id) && reEntries(game, player._id) === 0),

  // Сезон и характер
  once({ id: '33', icon: '🎟️', name: 'Финалист', description: 'Сыграть в финале' }, ({ player, game }) =>
    game.settings.isFinal && hasPlayed(game, player._id)),
  counter({ id: '34', icon: '🥈', name: 'Вечно второй', description: 'Трижды закончить игру вторым по итогу' }, 3, ({ player, game }) => {
    const rubles = gameRubles(game)
    const mine = rubles[player._id!.toString()] ?? 0
    return +(game.players.length >= 3 && Object.values(rubles).filter(v => v > mine).length === 1)
  }),
  once({ id: '35', icon: '🔄', name: 'Камбэк', description: 'Закончить в плюсе после трёх проигрышей подряд' }, ({ player, game, history }) =>
    isInPlus(game, player._id) && history.length >= 3 && history.slice(-3).every(g => isLost(g, player._id))),
  once({ id: '36', icon: '🧳', name: 'Блудный сын', description: 'Вернуться после трёх пропущенных подряд игр сезона' }, ({ player, game, seasonGames, history }) => {
    const previous = [...seasonGames].sort((a, b) => a.createdAt - b.createdAt).slice(-3)
    return history.length > 0 && hasPlayed(game, player._id) && previous.length === 3 && previous.every(g => !hasPlayed(g, player._id))
  }),
  once({ id: '37', icon: '🍼', name: 'Новичкам везёт', description: 'Закончить в плюсе самую первую игру' }, ({ player, game, history }) =>
    history.length === 0 && isInPlus(game, player._id)),

  // Число игр
  counter({ id: '38', icon: '🪑', name: 'Мебель', description: 'Сыграть 50 игр' }, 50, ({ player, game }) =>
    +hasPlayed(game, player._id)),
  counter({ id: '39', icon: '🏛️', name: 'Часть интерьера', description: 'Сыграть 100 игр' }, 100, ({ player, game }) =>
    +hasPlayed(game, player._id)),

  // Секретные: видны только тем, кто получил
  once({ id: '40', icon: '⚖️', name: 'Ни нашим, ни вашим', description: 'Закончить игру ровно в нуле', isSecret: true }, ({ player, game }) =>
    hasPlayed(game, player._id) && (gameRubles(game)[player._id!.toString()] ?? 0) === 0),
  once({ id: '41', icon: '📆', name: 'Пятница — это состояние души', description: 'Сыграть не в пятницу (и не закончить до обеда субботы)', isSecret: true }, ({ game }) =>
    !isFridayGame(game)),
  once({ id: '42', icon: '🦉', name: 'Ночная смена', description: 'Доиграть после 3:00 по Москве', isSecret: true }, ({ game }) => {
    if (!game.finishedAt) {
      return false
    }
    const { hour } = moscowTime(game.finishedAt)
    return hour >= 3 && hour < 12
  }),
]

// Итоги сезона считаются по всем его играм, когда финал сыгран, — даже если сам игрок в финал не попал
const seasonAchievments: (AchievmentInfo & { check: (totals: Record<string, number>, playerId: string) => boolean })[] = [
  {
    id: '43',
    icon: '💼',
    name: 'Король сезона',
    description: 'Закончить сезон с лучшим итогом в таблице',
    maxProgress: 1,
    check(totals, playerId) {
      const best = Math.max(...Object.values(totals).map(Math.round))
      return best > 0 && Math.round(totals[playerId] ?? 0) === best
    },
  },
  {
    id: '44',
    icon: '📊',
    name: 'Сезон в плюс',
    description: 'Закончить сезон в плюсе',
    maxProgress: 1,
    check: (totals, playerId) => Math.round(totals[playerId] ?? 0) > 0,
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

/*
 * Пересчёт после изменения игр: их участники, а если затронут сезон с финалом (или сам финал) —
 * все игроки сезона, потому что «Король сезона» и «Сезон в плюс» зависят от всей таблицы.
 */
export async function recalculateForGames(games: Pick<Game, 'players' | 'seasonId' | 'settings'>[]) {
  const ids = new Map<string, ObjectId>()
  const add = (id: ObjectId) => ids.set(id.toString(), id)
  games.forEach(g => g.players.forEach(p => add(p.playerId)))

  const seasonIds = games.map(g => g.seasonId).filter(nonNull)
  if (seasonIds.length > 0) {
    const seasonGames = await (await getDb()).games.find({ seasonId: { $in: seasonIds }, isFinished: true }, { projection: { players: 1, seasonId: 1, settings: 1 } }).toArray()
    for (const seasonId of seasonIds) {
      const inSeason = seasonGames.filter(g => g.seasonId?.equals(seasonId))
      const touchesFinal = [...inSeason, ...games.filter(g => g.seasonId?.equals(seasonId))].some(g => g.settings.isFinal)
      if (touchesFinal) {
        inSeason.forEach(g => g.players.forEach(p => add(p.playerId)))
      }
    }
  }
  await recalculateAchievments([...ids.values()])
}

export async function fullUpdateAchievments(playerId: ObjectId) {
  const db = await getDb()
  const player = await db.players.findOne({ _id: playerId })
  if (!player) {
    return
  }
  const games = await db.games.find({ $and: [{ 'players.playerId': player._id }, { isFinished: true }] }).sort({ createdAt: 1, _id: 1 }).toArray()
  const seasonIds = [...new Map(games.map(g => g.seasonId).filter(nonNull).map(id => [id.toString(), id])).values()]
  const seasons = new Map(await Promise.all(seasonIds.map(async seasonId =>
    [seasonId.toString(), await db.games.find({ seasonId, isFinished: true }).toArray()] as const)))

  const oldSecretAchievments = player.achievments?.filter(a => secretAchievments.some(s => s.id === a.id && a.progress[0] === s.maxProgress)) ?? []
  await db.players.updateOne({ _id: player._id }, { $set: { achievments: [...oldSecretAchievments, ...computeAchievments(player, games, seasons)] } })
}

/*
 * Чистый расчёт: games — завершённые игры игрока по порядку, seasons — все завершённые игры
 * каждого его сезона (по id сезона). Ручные секретные достижения сюда не входят.
 */
export function computeAchievments(player: WithId<Player>, games: WithId<Game>[], seasons: Map<string, WithId<Game>[]>): NonNullable<Player['achievments']> {
  let achievs: NonNullable<Player['achievments']> = []

  for (const [index, game] of games.entries()) {
    const seasonGames = nonNull(game.seasonId) ? (seasons.get(game.seasonId.toString()) ?? []).filter(g => g.createdAt < game.createdAt) : []
    const history = games.slice(0, index)
    const updatedPlayer: WithId<Player> = { ...player, achievments: achievs }
    achievs = possibleAchievments.map(a => ({ id: a.id, progress: a.calcNewProgress({ player: updatedPlayer, game, seasonGames, history }) }))
  }

  // Итоги сезонов, где уже сыгран финал
  const finishedSeasons = [...seasons.values()].filter(seasonGames => seasonGames.some(g => g.settings.isFinal)).map(seasonGames => buildSeasonTable(seasonGames).totals)
  const seasonProgress = seasonAchievments.map(a => ({
    id: a.id,
    progress: [+finishedSeasons.some(totals => a.check(totals, player._id.toString())), a.maxProgress] as Progress,
  }))

  return [...achievs, ...seasonProgress]
}

function publicInfo({ id, icon, name, description, maxProgress, isSecret, unit }: AchievmentInfo): AchievmentInfo {
  return { id, icon, name, description, maxProgress, isSecret, unit }
}

export function getAchievmentsInfo(): AchievmentInfo[] {
  return [...possibleAchievments, ...seasonAchievments, ...secretAchievments].map(publicInfo)
}

/*
 * Доля игроков, у которых есть достижение. Считаем среди тех, кто сыграл хотя бы одну игру:
 * иначе профили, которые только открыли приложение, делали бы всё «редким».
 */
export async function getAchievmentsRarity(): Promise<Record<string, number>> {
  const db = await getDb()
  const activeIds = await db.games.distinct('players.playerId', { isFinished: true })
  if (activeIds.length === 0) {
    return {}
  }
  const players = await db.players.find({ _id: { $in: activeIds } }, { projection: { achievments: 1 } }).toArray()
  const earned: Record<string, number> = {}
  for (const player of players) {
    for (const a of player.achievments ?? []) {
      if (a.progress[0] >= a.progress[1]) {
        earned[a.id] = (earned[a.id] ?? 0) + 1
      }
    }
  }
  return Object.fromEntries(getAchievmentsInfo().map(a => [a.id, (earned[a.id] ?? 0) / players.length]))
}
