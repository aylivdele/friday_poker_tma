import { validate } from '@tma.js/init-data-node'
import { normalizePhone } from '@/lib/phone'
import { badRequest } from './http'

// Контакт, которым пользователь поделился через requestContact. Telegram подписывает его так же, как initData.
export function verifyContact(raw: string, botToken: string): { userId: number, phone: string } {
  try {
    // Telegram отдаёт ранее отправленный контакт со старой датой, поэтому срок не проверяем:
    // повтор безопасен, потому что номер привязывается только к тому же пользователю Telegram
    validate(raw, botToken, { expiresIn: 0 })
  }
  catch {
    throw badRequest('Не удалось проверить номер телефона')
  }

  let contact: { user_id?: unknown, phone_number?: unknown }
  try {
    contact = JSON.parse(new URLSearchParams(raw).get('contact') ?? '')
  }
  catch {
    throw badRequest('Не удалось прочитать номер телефона')
  }

  const phone = typeof contact.phone_number === 'string' ? normalizePhone(contact.phone_number) : null
  if (typeof contact.user_id !== 'number' || !phone) {
    throw badRequest('Не удалось прочитать номер телефона')
  }
  return { userId: contact.user_id, phone }
}
