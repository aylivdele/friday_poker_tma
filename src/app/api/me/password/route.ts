import { z } from 'zod'
import { getDb } from '@/core/db'
import { requireAuth } from '@/server/auth'
import { toMe } from '@/server/dto'
import { badRequest, forbidden, parseBody, route } from '@/server/http'
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, verifyPassword } from '@/server/password'
import { deletePlayerSessions } from '@/server/sessions'

const passwordSchema = z.object({
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `не короче ${PASSWORD_MIN_LENGTH} символов`)
    .max(PASSWORD_MAX_LENGTH, `не длиннее ${PASSWORD_MAX_LENGTH} символов`),
  currentPassword: z.string().max(PASSWORD_MAX_LENGTH).optional(),
})

// Telegram служит способом восстановления: изнутри Telegram пароль меняется без старого
export const PUT = route(async (req) => {
  const auth = await requireAuth(req)
  const { password, currentPassword } = await parseBody(req, passwordSchema)
  if (!auth.player.phone) {
    throw badRequest('Сначала подтвердите номер телефона')
  }
  if (auth.via === 'session') {
    if (!auth.player.passwordHash || !currentPassword || !await verifyPassword(currentPassword, auth.player.passwordHash)) {
      throw forbidden('Текущий пароль указан неверно')
    }
  }

  const passwordHash = await hashPassword(password)
  await (await getDb()).players.updateOne({ _id: auth.player._id }, { $set: { passwordHash } })
  // Остальные устройства выходят; из браузера текущая сессия сохраняется
  await deletePlayerSessions(auth.player._id, auth.via === 'session' ? auth.sessionId : undefined)

  return toMe({ ...auth, player: { ...auth.player, passwordHash } })
})
