// Форматирование для интерфейса: деньги, даты, имена

const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

// 1 200 ₽, со знаком: +1 200 ₽ / −300 ₽
export function formatMoney(value: number, { sign = false }: { sign?: boolean } = {}): string {
  const rounded = Math.round(value)
  const prefix = rounded < 0 ? '−' : sign && rounded > 0 ? '+' : ''
  return `${prefix}${integer.format(Math.abs(rounded))} ₽`
}

// Дата игры хранится как полночь UTC, поэтому и показываем в UTC
const gameDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const dateTime = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// «пт, 3 октября»
export function formatGameDate(timestamp: number) {
  return gameDate.format(timestamp)
}

// «26 сент.»
export function formatShortDate(timestamp: number) {
  return shortDate.format(timestamp)
}

// «3 окт., 20:41» — по местному времени
export function formatDateTime(timestamp: number) {
  return dateTime.format(timestamp)
}

interface Named { firstName?: string, lastName?: string }

export function playerName(player?: Named | null): string {
  return [player?.firstName, player?.lastName].filter(Boolean).join(' ') || 'Без имени'
}

// «Боб Б.» — для узких мест
export function shortPlayerName(player?: Named | null): string {
  const first = player?.firstName || 'Без имени'
  return player?.lastName ? `${first} ${player.lastName[0]}.` : first
}

export function initials(player?: Named | null): string {
  return ((player?.firstName?.[0] ?? '') + (player?.lastName?.[0] ?? '')).toUpperCase() || '?'
}

// «3 игры», «5 игр», «1 игра»
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many
  return `${n} ${word}`
}
