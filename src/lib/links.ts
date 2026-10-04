// Ссылки на игру — общие для сервера (сообщения бота) и интерфейса (поделиться)

export function gameStartParam(gameId: string) {
  return `game_${gameId}`
}

export function gameIdFromStartParam(param: string) {
  return /^game_([0-9a-f]{24})$/.exec(param)?.[1] ?? null
}

// https://t.me/<бот>/<приложение>?startapp=game_<id>: открывает игру прямо в Telegram
export function telegramGameLink(telegramAppUrl: string, gameId: string) {
  const url = new URL(telegramAppUrl)
  url.searchParams.set('startapp', gameStartParam(gameId))
  return url.toString()
}
