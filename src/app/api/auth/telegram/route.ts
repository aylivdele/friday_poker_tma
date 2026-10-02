import { registerTelegramPlayer } from '@/server/auth'
import { toPublicPlayer } from '@/server/dto'
import { route } from '@/server/http'

// Вход из Telegram: находит игрока по данным Telegram или регистрирует нового
export const POST = route(async (req) => {
  return toPublicPlayer(await registerTelegramPlayer(req))
})
