import { z } from 'zod'
import { getDb } from '@/core/db'
import { botToken, requireAuth } from '@/server/auth'
import { verifyContact } from '@/server/contact'
import { toMe } from '@/server/dto'
import { conflict, forbidden, parseBody, route } from '@/server/http'

const phoneSchema = z.object({ contactRaw: z.string().min(1).max(4096) })

// Подтверждение номера: контакт, которым пользователь поделился в Telegram, подписан Telegram
export const POST = route(async (req) => {
  const auth = await requireAuth(req)
  if (auth.via !== 'telegram' || !auth.player.telegramId) {
    throw forbidden('Подтвердить номер можно только в приложении внутри Telegram')
  }
  const { contactRaw } = await parseBody(req, phoneSchema)
  const contact = verifyContact(contactRaw, botToken())
  if (contact.userId !== auth.player.telegramId) {
    throw forbidden('Этот номер принадлежит другому пользователю Telegram')
  }

  const db = await getDb()
  const owner = await db.players.findOne({ phone: contact.phone, _id: { $ne: auth.player._id } }, { projection: { _id: 1 } })
  if (owner) {
    throw conflict('Номер уже привязан к другому аккаунту')
  }
  await db.players.updateOne({ _id: auth.player._id }, { $set: { phone: contact.phone } })
  return toMe({ ...auth, player: { ...auth.player, phone: contact.phone } })
})
